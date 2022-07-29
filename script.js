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
    let headerArr = ["Driver Name", "Start Location", "End Location", "Start Journey"]
    for (var i = 0;i<headerArr.length;i++){
        let cell = document.createElement("th");
        let text = document.createTextNode(headerArr[i]);
        cell.appendChild(text);
        headrow.appendChild(cell);
    }

    // populate table
    for (var i = 0;i<driverArr.length;i++){
        let row = table.insertRow();   
        var destinations = [driverArr[i].startAddressId, driverArr[i].endAddressId]

// add first column: driver name
        let driver = document.createElement("td");

        let curDriverName = ""
        if(driverArr[i].lastName != null)curDriverName = (driverArr[i].firstName + " " + driverArr[i].lastName);
        else curDriverName = (driverArr[i].firstName);
        let dName = document.createTextNode(curDriverName);
        driver.appendChild(dName);

        // clickable driver name
        driver.addEventListener('click', 
        (function(arr, id) {
            return function(){
                setMarker(arr, id, "Driver Location", true);
            };
        }) 
        (locArr, destinations[0]));

        row.appendChild(driver);

// second and third columns: clone location selector, add event listeners
        // listeners use closure to preserve the driverArr[i] variable, instead of changing it to the most current
        // function can be externalized: relevant link here:
            // https://stackoverflow.com/questions/10000083/javascript-event-handler-with-parameters
        driverToString = JSON.stringify(driverArr[i])
        var startSel = document.createElement("td");
        let startString = "<select name=\"locSelect\">"
        for (var j = 0;j<locArr.length;j++){
            let str = locArr[j].addressOne + locArr[j].addressTwo + ", " + locArr[j].city
            if(locArr[j].id == destinations[0]){
                startString+="<option value=" + "\"" + locArr[j].id + "\"selected >" + str + "</option>"
            }
            else{
                startString+="<option value=" + "\"" + locArr[j].id + "\">" + str + "</option>"
            }
        }
        startString+= "</select>"
        startSel.innerHTML = startString;

        startSel.addEventListener('change', (function(type, obj) {
            return function(e) {updateDriverAddress(e, type, obj); };
        }) ("start", driverToString), false);
        row.appendChild(startSel)

        var endSel = document.createElement("td");
        let endString = "<select name=\"locSelect\">"
        for (var j = 0;j<locArr.length;j++){
            let str = locArr[j].addressOne + locArr[j].addressTwo + ", " + locArr[j].city
            if(locArr[j].id == destinations[1]){
                endString+="<option value=" + "\"" + locArr[j].id + "\"selected >" + str + "</option>"
            }
            else{
                endString+="<option value=" + "\"" + locArr[j].id + "\">" + str + "</option>"
            }
        }
        endString+= "</select>"
        endSel.innerHTML = endString;

        endSel.addEventListener('change', (function(type, obj) {
            return function(e) {updateDriverAddress(e, type, obj); };
        }) ("end", driverToString), false);
        row.appendChild(endSel)

// start button fourth column
        let placehldr = document.createElement("td");
        let btn = document.createElement("button");
        btn.innerHTML = "Start"

        btn.addEventListener('click', 
        (function(arr, start, end) {
            return function() {
                startDrive(arr, start, end)
            }
        }) (locArr, destinations[0], destinations[1]), false);
        placehldr.appendChild(btn);
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

    // refresh table
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

    // refresh table
    table = document.querySelector("table");
    table.innerHTML = ""
    buildTable();   
}

// grab location and driver arrays from API, select table in HTML, call popTable()
async function buildTable(){
    var addresses = await getAddresses();
    var drivers = await getDrivers();
    table = document.querySelector("table");
    popTable(table, drivers, addresses);
}

function initMap(){
    window.map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 40, lng: -100},
        zoom: 4,
      });
}

function test(){
    alert("working")
}

function setMarker(locArr, addressID, name, highlight = false){
    for (var i = 0;i<locArr.length;i++){
        if(locArr[i].id == addressID){
            var latLong = { lat: locArr[i].lat, lng: locArr[i].lon};
        }
    }
    
    var marker = new google.maps.Marker({
        position: latLong,
        title: name
    });
    marker.setMap(window.map);

    if(highlight){
        window.map.panTo(latLong);
        window.map.setZoom(6);
    }
    return latLong;
}
function startDrive(locArr, start, end){
    setMarker(locArr, start, "Start", true);
    setMarker(locArr, end, "End");
}

function main(){
    buildTable();
}
main()