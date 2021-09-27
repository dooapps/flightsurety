import DOM from "./dom";
import Contract from "./contract";
import "./flightsurety.css";

(async () => {
  let result = null;
  let firstAirlineAddress = null;

  let contract = new Contract("localhost", () => {
    
            // data
            // let airline = DOM.elid('airline-name').value;
            // let flight = DOM.elid('flight-name').value;
            // let timestamp = DOM.elid('timestamp-id').value;

    contract.isOperational((error, result) => {
      console.log(error, result);
      display("Operational Status", "Check if contract is operational", [
        { label: "Operational Status", error: error, value: result },
      ]);
    });

    contract.getAirlinesRegisteredFunded((value) => {
      firstAirlineAddress = value;
      DOM.elid("firstRegisteredAirline").innerHTML = value;
    });

    contract.getAirlines((value) => {
        console.log(value);
        DOM.elid("countAirlines").innerHTML = value;
    });


    contract.getCurrentFlights((value) =>{
      console.log(value);
    })

    DOM.elid("submit-oracle").addEventListener("click", () => {
      let flight = DOM.elid("flight-number").value;
      contract.fetchFlightStatus(flight, (error, result) => {
        display("Oracles", "Trigger oracles", [
          {
            label: "Fetch Flight Status",
            error: error,
            value: result.flight + " " + result.timestamp,
          },
        ]);
      });
    });    

    DOM.elid("payAirline").addEventListener("click", () => {
      
      contract.payAirline(firstAirlineAddress, (response) => {
          console.log(response);
        displayMessage("pay airline is successful " + response);
      });
    });

    
    DOM.elid("registerAirlineBtn1").addEventListener("click", () => {
      
      var name = DOM.elid("airlineName1").value;
      var address = DOM.elid("airlineAddress1").value;
      try {
        contract.registerAirline(name, address, (response) => {
          displayMessage("airline registration 1 is successful" + response);
          
        });
      } catch (error) {
        
        displayMessage(error);
      }
    });

    DOM.elid("registerAirlineBtn2").addEventListener("click", () => {
      
      var name = DOM.elid("airlineName2").value;
      var address = DOM.elid("airlineAddress2").value;
      contract.registerAirline(name, address, (response) => {
        displayMessage("airline registration 2 is successful" + response);
        
      });
    });

    DOM.elid("registerAirlineBtn3").addEventListener("click", () => {
      
      var name = DOM.elid("airlineName3").value;
      var address = DOM.elid("airlineAddress3").value;
      contract.registerAirline(name, address, (response) => {
        displayMessage("airline registration 3 is successful" + response);
        
      });
    });

    DOM.elid("registerAirlineBtn4").addEventListener("click", () => {
      
      var name = DOM.elid("airlineName4").value;
      var address = DOM.elid("airlineAddress4").value;
      contract.registerAirline(name, address, (response) => {
        displayMessage("airline registration 4 is successful" + response);
        
      });
    });

    DOM.elid("registerAirlineBtn5").addEventListener("click", () => {
      
      var name = DOM.elid("airlineName5").value;
      var address = DOM.elid("airlineAddress5").value;

      contract.registerAirline(name, address, (response) => {
          
        displayMessage("airline registration 5 is successful" + response);
        
      });
    });


    DOM.elid("registerFlightBtn").addEventListener("click", () => {
        
        contract.registerFlight((response) => {            
          debugger;
          displayMessage("airlined Registered" + response);          
        });
      });

      DOM.elid("purchaseInsurancBtn").addEventListener("click", () => {        
        contract.registerInsurance((response) => {   
          debugger;         
          displayMessage("insurance purchased" + response);          
        });
      });



    // DOM.elid('submit-oracle').addEventListener('click', () => {
    //     let flight = DOM.elid('flight-number').value;
    //     // Write transaction
    //     contract.fetchFlightStatus(flight, (error, result) => {
    //         display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp} ]);
    //     });
    // })
  });
})();

function displayMessage(msg) {
  DOM.elid("msg").innerHTML = DOM.elid("msg").innerHTML + "<br/>" + msg;
}

function display(title, description, results) {
  let displayDiv = DOM.elid("display-wrapper");
  let section = DOM.section();
  section.appendChild(DOM.h2(title));
  section.appendChild(DOM.h5(description));
  results.map((result) => {
    let row = section.appendChild(DOM.div({ className: "row" }));
    row.appendChild(DOM.div({ className: "col-sm-4 field" }, result.label));
    row.appendChild(
      DOM.div(
        { className: "col-sm-8 field-value" },
        result.error ? String(result.error) : String(result.value)
      )
    );
    section.appendChild(row);
  });
  displayDiv.append(section);
}
