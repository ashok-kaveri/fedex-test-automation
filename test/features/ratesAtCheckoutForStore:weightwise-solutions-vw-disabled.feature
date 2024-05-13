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
      | weight          | length          | width          | height          | packagingType   | productIds  |
      | <productWeight> | <productLength> | <productWidth> | <productHeight> | <packagingType> | <productIds> |
  When I want to generate label for the order
  
  Examples:
  | testId | email             | country | first_name | last_name | address| serviceName    | productURL                                                            | productWeight | productLength | productWidth | productHeight | packagingType |  productIds     | 
  | #1248 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | My Post Parcel  | deck-of-playing-cards                                                 |  0.25         |   5           | 5            | 5             |               | BE9P05,BE1P05   |
  |  #1253 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | My Post Parcel | pre-packed-rubiks-cube                                                |  3.57         |   5           | 5            | 1             |               |  BE9P05,BE1P05 |
  |  #1252 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | My Post Parcel | greater-cubic-weight                                                  |  6.751        |    5          |  5           | 5             |               |  BE9P05,BE1P05 |
  |  #1251 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | My Post Parcel | weightless-dimensionless-spoon                                        |  0.01         |   5           | 5            | 5             |               | | 
  |  #1250 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | My Post Parcel | dimensionless-shoes                                                   |  0.45         |   5           | 5            | 5             |               ||
  |  #1249 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | My Post Parcel | weightless-greeting-card                                              |  0.01         |   5           | 5            | 5             |               ||
  |  #1259 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | My Post Parcel | unshippable-aircraft-wing-dimensions-are-105cm?variant=48872100069649 |  8            |   216.8       | 180.3        | 190.5         |               ||
  |  #1258 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | My Post Parcel | unshippable-drum-20-kg                                                |  24.00        |    5          |  5           |  5            |               || 
  |  #1257 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | My Post Parcel | pack-of-curtains-volumetric-weight-5g-and-weight-5                    |   6           |    5          |  5           |  5            |               ||
  |  #1256 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | My Post Parcel | unwieldy-spiral-toffee                                                |  13.00        |   12          | 12           | 12            |               ||
|  #1254 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | My Post Parcel | heavy-car-bumper-5kg                                                    |  11.123       |   5           |  5           |  5            |               | |

  
