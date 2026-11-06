# Spec Delta

## ADDED Requirements

### Requirement: Temperature says when a model does not use it

The agent editor SHALL always show the Temperature control. For a model with the feature
`fixed-sampling`, it SHALL show a note that this model doesn't use temperature, and the Language model
summary SHALL NOT show a temperature. Switching models SHALL NOT change the stored value.

#### Scenario: A model that does not use temperature

- **WHEN** the user picks a model with the feature `fixed-sampling`
- **THEN** Advanced shows the Temperature field with a note that this model doesn't use it
- **AND** the Language model summary shows no temperature

#### Scenario: A model that uses temperature

- **WHEN** the user picks a model without the feature `fixed-sampling`
- **THEN** Advanced shows the Temperature field with no note
- **AND** the Language model summary shows the temperature

#### Scenario: Switching back

- **WHEN** an agent with temperature 0.7 moves to a model with `fixed-sampling` and back, and is saved
- **THEN** Temperature shows 0.7 and the saved agent holds 0.7
