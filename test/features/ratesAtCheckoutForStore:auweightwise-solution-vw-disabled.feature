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
  |  #1250 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | PARCEL POST + SIGNATURE | deck-of-playing-cards                                                 |  0.25         |   5.0         | 5.0          |   5.0         |
  |  #1251 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | PARCEL POST + SIGNATURE | dimensionless-shoes                                                   |  0.45         |   5           | 5            |   5           |
  |  #1252 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | PARCEL POST + SIGNATURE | weightless-greeting-card                                              |  0.01         |   5           | 5            |   5           |
  |  #1253 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | PARCEL POST + SIGNATURE | weightless-dimensionless-spoon                                        |  0.01         |   5           | 5            |   5           |
  |  #1254 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | PARCEL POST + SIGNATURE | greater-cubic-weight                                                  |  1.36         |   5           | 5            |   5           |
  |  #1255 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | PARCEL POST + SIGNATURE | pre-packed-rubiks-cube                                                |  3.57         |   5           | 5            |   1           |
  |  #1256 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | PARCEL POST + SIGNATURE | heavy-car-bumper-5kg                                                  |  11.12        |   5           | 5            |   5           |
  |  #1257 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | PARCEL POST + SIGNATURE | unwieldy-spiral-toffee                                                |  13.00        |   12          | 12           |   12          |
  |  #1258 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | PARCEL POST + SIGNATURE | unshippable-aircraft-wing-dimensions-are-105cm                        |  8            |   5           | 5            |   5           |