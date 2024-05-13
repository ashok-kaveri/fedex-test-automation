Feature: Login to online store

  Scenario Outline: As a user, I want to login to online store

    Given I am on the storeLogin page of store
    When I log into shopify store using password

    Examples:
      |  store                                         | password  |
      | teststorealwinnew.myshopify.com                | stahmp    |
