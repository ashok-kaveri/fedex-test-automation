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
      | weight          | length          | width          | height          | packagingType   | 
      | <productWeight> | <productLength> | <productWidth> | <productHeight> | <packagingType> |
  When I want to generate label for the order
  
  Examples:
  | testId | email             | country | first_name | last_name | address| serviceName             | productURL                                                            | productWeight | productLength | productWidth | productHeight | packagingType |
  |  #1258 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | PARCEL POST + SIGNATURE | large-satchel-ie-is                                                 |  1.99         |   31.0        | 40.5         |   15.0        | PAL           |
  |  #1259 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | PARCEL POST + SIGNATURE | 1kg-satchel-ep-pp                                                     |  3.19         |   26.5        | 38.5         |   13.0        | CTN           |
  |  #1258 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | PARCEL POST + SIGNATURE | unshippable-aircraft-wing-dimensions-are-105cm?variant=48872100069649 |  8        |   216.8       | 180.3        |   190.5         | YOUR_PACKAGING |
  |  #1258 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | PARCEL POST + SIGNATURE | unshippable-drum-20-kg                                                |  24.00        |    80.0       | 90.1         |   80.1          | YOUR_PACKAGING |
  |  #1257 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | PARCEL POST + SIGNATURE | pack-of-curtains-volumetric-weight-5g-and-weight-5                    |  4.80         |    40.0        | 60.0        |   10.0          | YOUR_PACKAGING |
  |  #1256 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | PARCEL POST + SIGNATURE | unwieldy-spiral-toffee                                                |  13.00        |   12          | 12           |   12          | YOUR_PACKAGING |
  |  #1255 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | PARCEL POST + SIGNATURE | heavy-car-bumper-5kg                                                  |  11.12        |   80.1        | 20.1         |   10.1        | YOUR_PACKAGING |
  |  #1254 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | PARCEL POST + SIGNATURE | pre-packed-rubiks-cube                                                |  3.57         |   5           | 5            |   1           | YOUR_PACKAGING |
  |  #1257 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | PARCEL POST + SIGNATURE | greater-cubic-weight                                                  |  1.36         |    43.5       |  51          |   20           |  BAG |
  |  #1253 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | PARCEL POST + SIGNATURE | weightless-dimensionless-spoon                                        |  0.01         |   11          | 22           |   5           |  BAG | 
  |  #1252 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | PARCEL POST + SIGNATURE | weightless-greeting-card                                              |  0.01         |   11          | 22          |   2           | BAG   |
  |  #1251 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | PARCEL POST + SIGNATURE | dimensionless-shoes                                                   |  0.45         |   11          | 22          |   2           |  BAG          |
  |  #1250 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | PARCEL POST + SIGNATURE | deck-of-playing-cards                                                 |  0.25         |   11          | 22           |   2           |  BAG          |    
  |  #1254 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | PARCEL POST + SIGNATURE | pre-packed-rubiks-cube                                                |  3.57         |   5           | 5            |   1           | SAT |



