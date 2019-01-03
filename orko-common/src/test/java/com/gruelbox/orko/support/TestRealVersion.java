package com.gruelbox.orko.support;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class TestRealVersion {

  private static final String VALID_VERSION = "(\\d)+\\.(\\d)+\\.(\\d)+(-SNAPSHOT)?";

  @Test
  public void testVerifyCheckingRegex() {
    assertFalse("".matches(VALID_VERSION));
    assertFalse("1".matches(VALID_VERSION));
    assertFalse("0.1".matches(VALID_VERSION));
    assertFalse("0.1.".matches(VALID_VERSION));
    assertFalse("0.1.2-".matches(VALID_VERSION));
    assertFalse("0.1.2-SNAPSHOT-1".matches(VALID_VERSION));

    assertTrue("0.1.2".matches(VALID_VERSION));
    assertTrue("0.1.2-SNAPSHOT".matches(VALID_VERSION));
    assertTrue("0.14.21".matches(VALID_VERSION));
    assertTrue("1234.23.1234".matches(VALID_VERSION));
    assertTrue("1234.23.1234-SNAPSHOT".matches(VALID_VERSION));
  }

  @Test
  public void testGetVersion() {
    assertTrue(
      ReadVersion.readVersionInfoInManifest().equals("${project.version}") ||
      ReadVersion.readVersionInfoInManifest().matches(VALID_VERSION)
    );
  }

}
