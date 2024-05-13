Feature: Rates at checkout 

  Scenario Outline: TestId: "<testId>" As a user, I want to by a product from the store

  When I view the details of product using "<productURL>" for store
  And  I buy my product
  When I am on checkout, I enter my "<email>" my first name "<first_name>" and "<last_name>" and "<country>"
  When I enter my address "<address>"
  When I select my service as "<serviceName>"
  When I enter my credit card details
  When I confirm payment
  Then I should see my orderId
  When I click on rates logs for app and store and verify the product dimensions
      | weight          | length          | width          | weight          |
      | <productWeight> | <productLength> | <productWidth> | <productHeight> |
  When I want to generate label for the order
  
  Examples:
  | testId | email             | country | first_name | last_name | address| serviceName             | productURL                                                            | productWeight | productLength | productWidth | productHeight | 
  |  #1250 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | PARCEL POST + SIGNATURE | pack-of-curtains-volumetric-weight-5g-and-weight-5                    |  6            |   5.0         | 5.0          |   5.0         |
