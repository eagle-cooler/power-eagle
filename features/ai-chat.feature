Feature: The AI tab is a conversation beside a render stage
  The AI tab pairs a collapsible chat panel (conversations and thread as
  accordion sections) with a render stage that always shows one generated
  version. Sending a message generates or refines; version chips in the thread
  pick what is on stage; a failed turn shows red and can be deleted; collapsing
  the chat hands the stage the full tab.

  Scenario: Sending a message renders the generated extension on the stage
    Given the AI tab with a model that generates a working extension
    When I send the message "make a todo list"
    Then the generated view is on the stage with a v1 chip in the thread

  Scenario: Selecting an earlier version chip puts that version on the stage
    Given the AI tab with a conversation that has versions v1 and v2
    When I select the v1 chip in the thread
    Then v1's view is on the stage

  Scenario: A failed turn shows its error and can be deleted
    Given the AI tab with a conversation whose last turn failed
    When I delete the failed turn from the thread
    Then the failed turn disappears from the thread

  Scenario: Collapsing the chat panel gives the stage the full width
    Given the AI tab with a model that generates a working extension
    When I collapse the chat panel
    Then the thread is hidden and the stage remains
