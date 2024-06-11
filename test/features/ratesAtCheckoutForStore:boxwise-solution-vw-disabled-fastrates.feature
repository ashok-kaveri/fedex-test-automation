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
  | testId | email             | country | first_name | last_name | address| serviceName    | productURL                                                            |productWeight | productLength | productWidth | productHeight |packagingType  |  productIds   | 
  |  #1258 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | My Post Parcel | mypost-business-flat-rate-satchel-large                               |              |               |              |               |               | BE9P30,BE1P30 |
  |  #1259 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | My Post Parcel | mypost-business-flat-rate-satchel-medium                              |  3.19        |   26.5        | 38.5         |   13.0        |               | BE9P10,BE1P10 |
  |  #1260 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | My Post Parcel | unshippable-aircraft-wing-dimensions-are-105cm?variant=48466223825202 | 8.200        | 43.0          | 43.0         | 43.0          |               |               |
  |  #1261 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | My Post Parcel | unshippable-drum-20-kg                                                | 24.000       | 80.0          | 90.1         | 80.1          |               |               |
  |  #1262 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | My Post Parcel | unwieldy-spiral-toffee                                                | 13.000       | 12.0          | 12.0         | 12.0          |               |               |
  |  #1263 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | My Post Parcel | pack-of-curtains-volumetric-weight-5g-and-weight-5                    | 4.800        | 40.0          | 60.0         | 10.0          |               |               |
  |  #1264 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | My Post Parcel | heavy-car-bumper-5kg                                                  | 11.123       | 80.1          | 20.1         |  10.1         |               |               |
  |  #1265 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | My Post Parcel | weightless-greeting-card                                              |              |               |              |               |               | BE9P05,BE1P05 |
  |  #1266 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | My Post Parcel | dimensionless-shoes                                                   |              |               |              |               |               | BE9P05,BE1P05 |
  |  #1267 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | My Post Parcel | weightless-dimensionless-spoon                                        |              |               |              |               |               | BE9P05,BE1P05 | 
  |  #1268 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | My Post Parcel | pre-packed-rubiks-cube                                                | 3.570        |  5.0          | 5.0          |   1.0         |               |               |
  |  #1268 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | My Post Parcel | greater-cubic-weight                                                  | 1.556        |   43.0        | 43.0         |   43.0        |               |               | 
  |  #1270 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | My Post Parcel | deck-of-playing-cards                                                 |              |               |              |               |               | BE9P05,BE1P05 |

  
