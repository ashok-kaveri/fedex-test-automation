Feature: Rates at checkout 

  Scenario Outline: As a user, I want to by a product from the store


  When I select on the catalog to select a product
  When I view the details of my product
  And  I buy my product
  When I am on checkout, I enter my "<email>" my first name "<first_name>" and "<last_name>"
  When I enter my address "<address>"
  When I select my service as "<serviceName>"
  When I am on checkout, I enter my credit card no "<cardNo>" expiry"<expiry>" verification code "<cvv>" and name "<first_name>"
  When I confirm payment
  Then I should see my orderId
      Examples:
       | email             | country | first_name | last_name | address          | serviceName                | cardNo | expiry | cvv |
       | alwin@yopmail.com |   US    |  alwin     |  john     | Whels            | FedEx International First® | 1  | 02/25  | 111 |