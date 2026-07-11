Feature: Installed service and styling plugins contribute to the shared context
  A service or styling extension installed from disk (not just bundled) is
  activated into the host context when enabled: its methods, widgets, and theme
  reach every launched plugin, and its enable toggle actually governs the
  contribution. An installed contribution overrides a bundled one on collision,
  and a contributor that fails to activate is skipped without breaking the rest.

  Scenario: An enabled installed service plugin contributes its methods
    Given a host service whose install index has a service plugin "greeter" on disk
    When the host context is resolved with nothing disabled
    Then the context exposes the "greeter" service

  Scenario: An enabled installed styling plugin contributes its widgets and theme
    Given a host service whose install index has a styling plugin "neon" on disk
    When the host context is resolved with nothing disabled
    Then the context includes the "neon" widget type and records its theme

  Scenario: A disabled installed contributor is excluded from the context
    Given a host service whose install index has a service plugin "greeter" on disk
    When the host context is resolved with "greeter" disabled
    Then the context does not expose the "greeter" service

  Scenario: An installed styling contribution overrides a bundled one on collision
    Given a host service whose install index has a styling plugin that redefines the "badge" widget
    When the host context is resolved with nothing disabled
    Then the context's "badge" widget is the installed one, not the bundled Extras badge

  Scenario: A contributor that fails to activate is skipped and the others still contribute
    Given a host service with a working service plugin "greeter" and a broken contributor on disk
    When the host context is resolved with nothing disabled
    Then the context still exposes the "greeter" service

  Scenario: A contributor that fails is reported so the shell can show why
    Given a host service with a working service plugin "greeter" and a broken contributor on disk
    When the host context is resolved with nothing disabled
    Then the context reports the broken contributor as failed with its error
