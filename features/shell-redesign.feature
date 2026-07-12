Feature: The redesigned host shell
  The shell has three sections: installed (every extension on the machine, in
  one filterable list), install (get new extensions: install by name plus
  sources), and ai. Each extension row carries a status light that is also the
  enable toggle, and a failed extension says why it is unavailable.

  Scenario: The shell offers exactly three sections
    Given the shell is rendered with builtin and installed extensions
    Then the tabs are exactly "installed", "install" and "ai"

  Scenario: The installed tab lists every kind and source together
    Given the shell is rendered with builtin and installed extensions
    Then the builtin visual "File Creator" and the installed service "Greeter" are listed together

  Scenario: A kind chip narrows the list to that kind
    Given the shell is rendered with builtin and installed extensions
    When the user picks the "service" kind chip
    Then only service extensions remain listed

  Scenario: A source chip narrows the list to installed extensions
    Given the shell is rendered with builtin and installed extensions
    When the user picks the "installed" source chip
    Then only extensions installed from disk remain listed

  Scenario: Search narrows the list by name
    Given the shell is rendered with builtin and installed extensions
    When the user searches for "clip"
    Then only "Clipboard" remains listed

  Scenario: The status light is the enable toggle
    Given the shell is rendered with builtin and installed extensions
    When the user clicks Clipboard's status light
    Then Clipboard is off and its light offers to enable it

  Scenario: A failed extension says why it is unavailable
    Given the shell is rendered with an installed extension that fails to load
    When the user opens the failed extension from the list
    Then the detail explains the failure and how to recover

  Scenario: The install tab combines install-by-name with the sources list
    Given the shell is rendered with builtin and installed extensions
    When the user opens the "install" tab
    Then the install-by-name field and the registered sources are shown together
