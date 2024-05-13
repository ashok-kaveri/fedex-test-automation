Feature: Rates at checkout 

  Scenario Outline: TestId: "<testId>" As a user, I want to by a product from the store

 
    When I click on rates logs for app and store and verify the product dimensions
      | weight          | length          | width          | height          | packagingType   | productIds  |
      | <productWeight> | <productLength> | <productWidth> | <productHeight> | <packagingType> | <productIds> |
  
  Examples:
  | testId | email             | country | first_name | last_name | address| serviceName             | productURL            | productWeight | productLength | productWidth | productHeight | packagingType |  productIds     |  
  |  #1250 | alwin@yopmail.com |   AU    |  alwin     |  john     | Whels  | PARCEL POST + SIGNATURE | deck-of-playing-cards |  0.25         |   5           | 5            |   5           |             |  BE1P05,BE9P05   |



