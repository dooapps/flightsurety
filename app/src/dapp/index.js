
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';

(async() => {
  let result = null;

  function is_metamask_installed() {
    if (typeof window.ethereum !== 'undefined') {                
        return true
    } else {                
        return false
    }
  }



  let contract = new Contract('localhost', () => {
    // Read transaction
    contract.isOperational((error, result) => {
      console.log(error,result);
      display('Operational Status', 'Check if contract is operational', [{label: 'Operational Status', error: error, value: result}]);
    });


    
   


    // User-submitted transaction
    DOM.elid('submit-oracle').addEventListener('click', () => {
      var flightDropdown = DOM.elid('flight-number');
      let flightkey = flightDropdown.value;      
      let flightNumber =flightDropdown.options[flightDropdown.selectedIndex].text
      
      contract.fetchFlightStatus(flightkey, (error, result) => {
        display('Oracles', 'Trigger oracles', [{label: 'Fetch Flight Status', error: error, value: flightNumber}]);
        displaySpinner();
        setTimeout(() => {
          contract.getFlightByKey(flightkey, (error, result) => {
            display('Oracles', 'Flight Status', [{label: 'Current Flight Status', error: error, value: 'Flight Number: ' + result[1] + ' ' + ' Status Code: ' + getStatusText(result[3]) }]);              
          });          
          hideSpinner();
      }, 2000);
      });            
    })

    DOM.elid('submit-insurance').addEventListener('click', () => {
      var insuranceDropdown = DOM.elid('insurance-flight-number');
      let flightkey = insuranceDropdown.value;      
      
      var insuranceAmount = DOM.elid('insurance-amount').value;

      contract.buyInsurance(flightkey, insuranceAmount, (error, result) => {
        debugger;
        if(error == null){          
          display('Insurance', 'Buying Insurance', [{label: '', error: error, value: "Insurance Bought Successfully"}]);                               
        } else {        
          display('Insurance', 'Buying Insurance', [{label: '', error: error, value: result}]);                                         
        }
      });
    });

    DOM.elid('current-flights').addEventListener('click', () => {
      contract.getCurrentFlights((error, result) => {
        console.log(result);        
        var flightNumberDropdown = DOM.elid('flight-number'); 
        var insuranceFlightNumberDropdown = DOM.elid('insurance-flight');     
        

  
           
      });       
    })
  });
})();

function display(title, description, results) {
  let displayDiv = DOM.elid("display-wrapper");
  let section = DOM.section();
  section.appendChild(DOM.h2(title));
  section.appendChild(DOM.h5(description));
  results.map((result) => {
    let row = section.appendChild(DOM.div({className:'row'}));
    row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
    row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
    section.appendChild(row);
  })
  displayDiv.innerHTML = section.innerHTML;
}

function displaySpinner() {
  document.getElementById("oracles-spinner").hidden = false;
  document.getElementById("submit-oracle").disabled = true;
}

function hideSpinner() {
  document.getElementById("oracles-spinner").hidden = true;
  document.getElementById("submit-oracle").disabled = false;
}

function getStatusText(status) {
  let STATUS_CODE_UNKNOWN = 0;
  let STATUS_CODE_ON_TIME = 10;
  let STATUS_CODE_LATE_AIRLINE = 20;
  let STATUS_CODE_LATE_WEATHER = 30;
  let STATUS_CODE_LATE_TECHNICAL = 40;
  let STATUS_CODE_LATE_OTHER = 50;

  if(status == STATUS_CODE_ON_TIME) {
    return "ON TIME";
  }

  if(status == STATUS_CODE_LATE_AIRLINE) {
    return "LATE - AIRLINE";
  }

  if(status == STATUS_CODE_LATE_WEATHER) {
    return "LATE - WEATHER";
  }

  if(status == STATUS_CODE_LATE_TECHNICAL) {
    return "LATE - TECHNICAL";
  }

  if(status == STATUS_CODE_LATE_OTHER) {
    return "LATE - OTHER";
  }

  return "UNKNOWN";
}