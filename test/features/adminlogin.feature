Feature: Login 

  Scenario Outline: As a user, I want to login to my stores admin page 
    Given I am on the login page of store
    When I enter the email as "<email>"
    And I enter the password as "<password>"
    Examples:
      |  email                     | password       |
      # | alwin@pluginhive.com       | Plugin@1231212 |
      | athiramohan@pluginhive.com | Moana@24       |








