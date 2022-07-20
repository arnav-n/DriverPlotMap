// both functions for form style
function showElem(id){
    var elem = document.getElementById(id);
    elem.style.display = "block";
}
function hideElem(id){
    var elem = document.getElementById(id);
    elem.style.display = "none";
}

// populate given table with values from driver and location arrays
function popTable(table, driverArr, locArr){
    // create headers and populate first 4 cells
    let thead = table.createTHead();
    let headrow = thead.insertRow();
    let headerArr = ["Driver Name", "Start Location", "End Location", "Start Button Placeholder"]
    for (var i = 0;i<headerArr.length;i++){
        let cell = document.createElement("th");
        let text = document.createTextNode(headerArr[i]);
        cell.appendChild(text);
        headrow.appendChild(cell);
    }

    // creating select element once
    var select = document.createElement("td");

    let string = "<select name=\"locSelect\">"
    string += "<option value=" + "\"" + -1 + "\">--Please select a location--</option>"
    for (var i = 0;i<locArr.length;i++){
        let str = locArr[i].addressOne + locArr[i].addressTwo + ", " + locArr[i].city + ", " + locArr[i].country
        string+="<option value=" + "\"" + locArr[i].id + "\">" + str + "</option>"
    }
    string+= "</select>"
    select.innerHTML = string;

    // populate table
    for (var i = 0;i<driverArr.length;i++){
        let row = table.insertRow();   

        // add first column: driver name
        let driver = document.createElement("td");

        let curDriverName = ""
        if(driverArr[i].lastName != null)curDriverName = (driverArr[i].firstName + " " + driverArr[i].lastName);
        else curDriverName = (driverArr[i].firstName);
        let dName = document.createTextNode(curDriverName);
        driver.appendChild(dName);
        row.appendChild(driver);
        
        // second and third columns: clone location selector, add event listeners
        // listeners use closure to preserve the driverArr[i] variable, instead of changing it to the most current
        // function can be externalized: relevant link here:
            // https://stackoverflow.com/questions/10000083/javascript-event-handler-with-parameters

        // To Do: change curDriverName to the toString of the entire Driver JSON object
        driverToString = JSON.stringify(driverArr[i])
        let startSel = select.cloneNode(true);
        startSel.addEventListener('change', (function(type, obj) {
            return function(e) {updateDriverAddress(e, type, obj); };
        }) ("start", driverToString), false);
        row.appendChild(startSel)

        let endSel = select.cloneNode(true);
        endSel.addEventListener('change', (function(type, obj) {
            return function(e) {updateDriverAddress(e, type, obj); };
        }) ("end", driverToString), false);
        row.appendChild(endSel)

        // start button fourth column
        let placehldr = document.createElement("td");
        placehldr.appendChild(document.createTextNode("placeholder"));
        row.appendChild(placehldr);
    }
}

// get request, return array of driver names
async function getDrivers(){
    let response = await fetch('https://dev-deliveryapis.cookapp.net/rider-simulator-service/rest/riders')
    let drivers = await response.json()
    return drivers;
}

async function getAddresses(){
    let response = await fetch("https://dev-deliveryapis.cookapp.net/rider-simulator-service/rest/addresses")
    let addresses = await response.json();
    return addresses;
}

// process info from form, post the new driver, rebuild the table
async function newDriver(){
    // process info from form
    var fname_val = document.getElementById("fname").value; 
    var lname_val = document.getElementById("lname").value;

    var phnum_val = document.getElementById("phnum").value;
    var zipc_val = document.getElementById("zipc").value;


    // post the new driver
    await fetch("https://dev-deliveryapis.cookapp.net/rider-simulator-service/rest/riders",
        {
        headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
        },
        method: "POST",
        body: JSON.stringify({firstName: fname_val, lastName: lname_val, phonenumber:phnum_val, zipcode:zipc_val})
    })
    .then(function(res){ console.log(res) })
    .catch(function(res){ console.log(res) })

    // refresh table
    table = document.querySelector("table");
    table.innerHTML = ""
    buildTable();   
}

async function newAddress(){
    var add1val = document.getElementById('addressone').value;
    var add2val = document.getElementById('addresstwo').value;
    var cityval = document.getElementById('city').value;
    var stateval = document.getElementById('state').value;
    var countryval = document.getElementById('country').value;
    var zipcval = document.getElementById('zipcode').value;
    

    await fetch("https://dev-deliveryapis.cookapp.net/rider-simulator-service/rest/addresses",
        {
        headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
        },
        method: "POST",
        body: JSON.stringify({
        addressOne: add1val, addressTwo: add2val, city:cityval, 
        state:stateval,
        country: countryval,
        zipCode: zipcval})
    })
    .then(function(res){ console.log(res) })
    .catch(function(res){ console.log(res) })

    table = document.querySelector("table");
    table.innerHTML = ""
    buildTable();   
}

async function updateDriverAddress(e, type, driverToString){
    driverObj = JSON.parse(driverToString)
    console.log(driverObj.firstName + " " + type + " address changed to " + e.target.value)

    if(e.target.value==-1){
        alert("Please choose a valid location.")
        return;
    }

    var editedAddress = {};
    if(type === 'start'){
        editedAddress.startAddressId = e.target.value;
        editedAddress.endAddressId = driverObj.endAddressId;
    }else{
        editedAddress.startAddressId = driverObj.startAddressId;
        editedAddress.endAddressId = e.target.value;
    }
    // PUT (driver, editedaddress)
    await fetch("https://dev-deliveryapis.cookapp.net/rider-simulator-service/rest/riders/" + driverObj.id ,{
        headers: {
              'Content-Type': 'application/json'
        },
        method: 'PUT',
        body: JSON.stringify(editedAddress)
      })
      .then(response => {
          if(!response.ok)
          {
              throw new Error("ERROR");        
          }
      })
      .then( data => {
          alert("Address update success! ");
        //   fetchDrivers();
      })
      .catch(error => {
          alert(" Error while updating address " + error);
        //   fetchDrivers();
      })
}

// grab location and driver arrays from API, select table in HTML, call popTable()
async function buildTable(){
    var addresses = await getAddresses();
    var drivers = await getDrivers();
    table = document.querySelector("table");
    popTable(table, drivers, addresses);
}

function initMap(){
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: -34.397, lng: 150.644 },
        zoom: 8,
      });
}

function main(){
    buildTable();
}
main()