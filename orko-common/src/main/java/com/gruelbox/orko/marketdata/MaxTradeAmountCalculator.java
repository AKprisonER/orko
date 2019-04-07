package com.gruelbox.orko.marketdata;

import static com.gruelbox.orko.marketdata.MarketDataType.BALANCE;
import static java.math.BigDecimal.ZERO;
import static java.math.RoundingMode.DOWN;

import java.math.BigDecimal;

import org.knowm.xchange.dto.Order.OrderType;
import org.knowm.xchange.dto.meta.CurrencyPairMetaData;

import com.google.common.base.MoreObjects;
import com.google.inject.Inject;
import com.google.inject.assistedinject.Assisted;
import com.gruelbox.orko.exchange.ExchangeService;
import com.gruelbox.orko.marketdata.ExchangeEventRegistry.ExchangeEventSubscription;
import com.gruelbox.orko.spi.TickerSpec;

public class MaxTradeAmountCalculator {

  private final ExchangeEventRegistry exchangeEventRegistry;

  private final TickerSpec tickerSpec;
  private final BigDecimal amountStepSize;
  private final Integer priceScale;

  @Inject
  MaxTradeAmountCalculator(@Assisted final TickerSpec tickerSpec,
                           final ExchangeEventRegistry exchangeEventRegistry,
                           final ExchangeService exchangeService) {
    this.tickerSpec = tickerSpec;
    this.exchangeEventRegistry = exchangeEventRegistry;

    CurrencyPairMetaData currencyPairMetaData = exchangeService.get(tickerSpec.exchange())
        .getExchangeMetaData()
        .getCurrencyPairs()
        .get(tickerSpec.currencyPair());

    this.amountStepSize = currencyPairMetaData.getAmountStepSize();
    this.priceScale = MoreObjects.firstNonNull(currencyPairMetaData.getPriceScale(), 0);
  }

  public BigDecimal adjustAmountForLotSize(BigDecimal amount) {
    if (amountStepSize != null) {
      BigDecimal remainder = amount.remainder(amountStepSize);
      if (remainder.compareTo(ZERO) != 0) {
        BigDecimal newAmount = amount.subtract(remainder);
        return newAmount;
      }
    }
    return amount;
  }

  public BigDecimal validOrderAmount(BigDecimal limitPrice, OrderType direction) {
    BigDecimal result;
    try (ExchangeEventSubscription subscription = exchangeEventRegistry.subscribe(MarketDataSubscription.create(tickerSpec, BALANCE))) {
      if (direction.equals(OrderType.ASK)) {
        result = blockingBalance(subscription, tickerSpec.base()).setScale(priceScale, DOWN);
      } else {
        BigDecimal available = blockingBalance(subscription, tickerSpec.counter());
        result = available.divide(limitPrice, priceScale, DOWN);
      }
    }
    return adjustAmountForLotSize(result);
  }

  private BigDecimal blockingBalance(ExchangeEventSubscription subscription, String currency) {
    return subscription.getBalances()
        .filter(b -> b.currency().equals(currency))
        .blockingFirst()
        .balance()
        .available();
  }

  public static class Factory {

    private final ExchangeEventRegistry exchangeEventRegistry;
    private final ExchangeService exchangeService;

    @Inject
    public Factory(ExchangeEventRegistry exchangeEventRegistry, ExchangeService exchangeService) {
      this.exchangeEventRegistry = exchangeEventRegistry;
      this.exchangeService = exchangeService;
    }

    public MaxTradeAmountCalculator create(TickerSpec tickerSpec) {
      return new MaxTradeAmountCalculator(tickerSpec, exchangeEventRegistry, exchangeService);
    }
  }
}