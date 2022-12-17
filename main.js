/*
-----------------------------------------------------------------------------------------
  // DISCLAIMER //
  Due to the way p5js works, I cannot have more than one javascript file that can run p5js files
  at the same time - therefore everything is crammed into here unfortunately.

  // PURPOSE OF TWO MAJOR SECTIONS //
  1) SVG Layers Interaction (line 45 to 70)
  2) Pan/Zoom Navigation (line 71 to 182)
  3) GUI Navigation (line 183 to the end of the script)
  4) Important Functions (line 1371 to the end of the script)

  // SVG LAYERS INTERACTION //
  Inside every "inside" page of every body, it has an interactible body that allows you
  to separate each layer of the body.

  // PAN/ZOOM NAVIGATION //
  The purpose of this is to allow the user to navigate through the Solar System.
  Not only navigation but smooth zoom-in transitions to one of the bodies the user clicked 
  on to learn more about it, and potentially going inside the planet to explore.

  // GUI NAVIGATION //
  This contains all user input for the interaction with the GUI and the bodies in the Solar
  System.
-----------------------------------------------------------------------------------------
*/

// Location state is where the user is in the poster:
// - (menu)
// - (space)
// - (earth-home) -> (earth-what-is) OR (earth-inside) OR (earth-facts)
// - etc. for all bodies (planets and the sun)
var locationState;

// Different action states include:
// - (none) - no action happened, can navigate around and click on bodies.
// - (inBody) - (the user zoomed into the body, disabled zooming and interaction unless back is clicked.
var actionState;
var body; // Different kind of state but for the body (specific planet or the sun) the user is on

var svg = document.getElementById("solar-system"); // SVG of all of the bodies in the Solar System



//-----------------------------// SVG LAYERS NAVIGATION //-----------------------------//
// All SVGs are the interactibles in the "inside" pages:
// - body: the SVG of the body interactible
// - outerLeft: left start position of the larger interactible
// - outerWidth: how far it can be dragged
// - innerLeft: left start position of the smaller interactible
// - outerWidth: how far it can be dragged
layersInteractivity(".sun-svg", 28, 120, 28, 120);
layersInteractivity(".mercury-svg", 5, 140, 18, 140);
layersInteractivity(".venus-svg", 29, 115, 20, 115);
layersInteractivity(".earth-svg", 29, 115, 20, 115);

Draggable.create(document.querySelector("#mars-core"), // Only has one interactible (the core)
{
  type: "x",
  bounds: {left: 33, width: 110}
})

layersInteractivity(".jupiter-svg", 20, 120, 30, 120);
layersInteractivity(".saturn-svg", 22, 120, 20, 120);
layersInteractivity(".uranus-svg", 29, 120, 20, 120);
layersInteractivity(".neptune-svg", 19, 120, 20, 120);
layersInteractivity(".pluto-svg", 16, 120, 8, 120);



//-----------------------------// PAN/ZOOM NAVIGATION //-----------------------------//
var proxy = document.createElement("div");
var viewport = document.querySelector("#viewport");

// Gets points of SVGs for precise pan and zoom (prevents weird clipping due to the viewBox)
var pt = svg.createSVGPoint();
var startClient = svg.createSVGPoint();
var startGlobal = svg.createSVGPoint();

var viewBox = svg.viewBox.baseVal;

// Zoom animation properties
var zoom =
{
  animation: new TimelineLite(),
  scaleFactor: 1.6, // How much it zooms
  duration: 0.5,
  ease: Power2.easeOut
};

// Pan properties
var pannable = new Draggable(proxy, {
  trigger: viewport,
  type:"x,y",
  bounds: {minX: 900, maxX: 300, minY: 100, maxY: 600},
  onPress: selectDraggable,
  onDrag: updateViewBox,
});

window.addEventListener("wheel", onWheel);
window.addEventListener("contextmenu", function(event) // Prevents right click to open up menu
{
  event.preventDefault();
	event.stopPropagation();
  return false;
});

// OnWheel function
function onWheel(event) 
{
  event.preventDefault();
  
  var normalized;  
  var delta = event.wheelDelta;

  if (delta) 
  {
    normalized = (delta % 120) == 0 ? delta / 120 : delta / 12;
  } 
  else 
  {
    delta = event.deltaY || event.detail || 0;
    normalized = -(delta % 3 ? delta * 10 : delta / 3);
  }
  
  var scaleDelta = normalized > 0 ? 1 / zoom.scaleFactor : zoom.scaleFactor;
  
  pt.x = event.clientX;
  pt.y = event.clientY;
  
  var startPoint = pt.matrixTransform(svg.getScreenCTM().inverse());
    
  var fromVars = 
  {
    ease: zoom.ease,
    x: viewBox.x,
    y: viewBox.y,
    width: viewBox.width,
    height: viewBox.height
  };

  viewBox.x -= (startPoint.x - viewBox.x) * (scaleDelta - 1);
  viewBox.y -= (startPoint.y - viewBox.y) * (scaleDelta - 1);
  viewBox.width *= scaleDelta;
  viewBox.height *= scaleDelta;
    
  zoom.animation = TweenLite.from(viewBox, zoom.duration, fromVars); 
}

function selectDraggable(event)
{
  startClient.x = this.pointerX;
  startClient.y = this.pointerY;
  startGlobal = startClient.matrixTransform(viewport.getScreenCTM().inverse());
    
  TweenLite.set(proxy, 
  { 
    x: this.pointerX, 
    y: this.pointerY
  });
  
  pannable.enable().update().startDrag(event);
}

function updateViewBox() {
  
  if (zoom.animation.isActive()) 
  {
    return;
  }
  
  pt.x = this.x;
  pt.y = this.y;
  
  var moveGlobal = pt.matrixTransform(svg.getScreenCTM().inverse());
    
  viewBox.x -= (moveGlobal.x - startGlobal.x);
  viewBox.y -= (moveGlobal.y - startGlobal.y); 
}



//-----------------------------// GUI INTERACTION //-----------------------------//
function setup()
{
  noCanvas();

  locationState = "space"; // Change to menu once it is implemented
  actionState = "none";
  body = null;
}

function draw()
{
  // The functions within the draw() handle events when user clicks on certain bodies, section buttons,
  // back buttons, and changes states depending on where the user is.

  // Sun Functions
  let sunButton = this.document.getElementById('sun-highlight');
  sunButton.addEventListener('click', function() // If the Sun is clicked
  { 
    let sunGUI = select('#sun-home'); // Grabs GUI
    openGUI("sun-home", "sun", sunGUI);
  });

  let sunButtons = this.document.getElementsByClassName("btn-sun");
  if (body == "sun")
  {
    let whatIsButton = sunButtons[0];
    whatIsButton.addEventListener("click", function()
    {
      let currentGUI = select("#sun-home");
      let nextGUI = select("#sun-what-is");

      if (currentGUI.style("visibility") == "visible")
      {
        currentGUI.style("visibility","hidden");
        nextGUI.style("visibility","visible");

        locationState = "sun-what-is";
      }
    });

    let insideButton = sunButtons[1];
    insideButton.addEventListener("click", function()
    {
      let currentGUI = select("#sun-home");
      let nextGUI = select("#sun-inside");

      let svgGUI = select(".sun-svg");
      let divSVG = select(".inside-svg .sun-svg");
      let outerSVG = select(".outerArea .sun-svg");
      let innerSVG = select(".sun-svg .smallerLayer");

      if (currentGUI.style("visibility") == "visible")
      {
        currentGUI.style("visibility","hidden");
        nextGUI.style("visibility","visible");
        svgGUI.style("visibility","visible");
        divSVG.style("visibility","visible");
        outerSVG.style("visibility","visible");
        innerSVG.style("visibility","visible");

        locationState = "sun-inside";
      }
    });

    let factsButton = sunButtons[2];
    factsButton.addEventListener("click", function()
    {
      let currentGUI = select("#sun-home");
      let nextGUI = select("#sun-facts");

      if (currentGUI.style("visibility") == "visible")
      {
        currentGUI.style("visibility","hidden");
        nextGUI.style("visibility","visible");

        locationState = "sun-facts";
      }
    });
  }

  let sunBackButtons = this.document.getElementsByClassName("back-btn-sun");
  if (body == "sun")
  {
    if (locationState == "sun-home")
    {
      let backButton = sunBackButtons[0];
      backButton.addEventListener('click', function()
      {
        let sunGUI = select('#sun-home'); // Grabs GUI
        closeGUI(sunGUI);
      })
    }
    else if (locationState == "sun-what-is")
    {
      let currentGUI = select("#sun-what-is");
      let nextGUI = select("#sun-home");
      let backButton = sunBackButtons[1];
      backButton.addEventListener('click', function()
      {
        backHome(body, currentGUI, nextGUI);
      })
    }
    else if (locationState == "sun-inside")
    {
      let currentGUI = select("#sun-inside");
      let nextGUI = select("#sun-home");
      let svgGUI = select(".sun-svg");
      let divSVG = select(".inside-svg .sun-svg");
      let outerSVG = select(".outerArea .sun-svg");
      let innerSVG = select(".sun-svg .smallerLayer");
      
      let backButton = sunBackButtons[2];
      backButton.addEventListener('click', function()
      {
        backHome(body, currentGUI, nextGUI, svgGUI, divSVG, outerSVG, innerSVG);
      })
    }
    else if (locationState == "sun-facts")
    {
      let currentGUI = select("#sun-facts");
      let nextGUI = select("#sun-home");
      let backButton = sunBackButtons[3];
      backButton.addEventListener('click', function()
      {
        backHome(body, currentGUI, nextGUI);
      })
    }
  }



  // Mercury Functions
  let mercuryButton = this.document.getElementById('mercury-highlight');
  mercuryButton.addEventListener('click', function() // If Mercury is clicked
  {
    let mercuryGUI = select('#mercury-home'); // Grabs GUI
    openGUI("mercury-home", "mercury", mercuryGUI)
  });

  let mercuryButtons = this.document.getElementsByClassName("btn-mercury");
  if (body == "mercury")
  {
    let whatIsButton = mercuryButtons[0];
    whatIsButton.addEventListener("click", function()
    {
      let currentGUI = select("#mercury-home");
      let nextGUI = select("#mercury-what-is");

      if (currentGUI.style("visibility") == "visible")
      {
        currentGUI.style("visibility","hidden");
        nextGUI.style("visibility","visible");

        locationState = "mercury-what-is";
      }
    });

    let insideButton = mercuryButtons[1];
    insideButton.addEventListener("click", function()
    {
      let currentGUI = select("#mercury-home");
      let nextGUI = select("#mercury-inside");
      
      let svgGUI = select(".mercury-svg");
      let divSVG = select(".inside-svg .mercury-svg");
      let outerSVG = select(".outerArea .mercury-svg");
      let innerSVG = select(".mercury-svg .smallerLayer");

      if (currentGUI.style("visibility") == "visible")
      {
        currentGUI.style("visibility","hidden");
        nextGUI.style("visibility","visible");
        svgGUI.style("visibility","visible");
        divSVG.style("visibility","visible");
        outerSVG.style("visibility","visible");
        innerSVG.style("visibility","visible");

        locationState = "mercury-inside";
      }
    });

    let factsButton = mercuryButtons[2];
    factsButton.addEventListener("click", function()
    {
      let currentGUI = select("#mercury-home");
      let nextGUI = select("#mercury-facts");

      if (currentGUI.style("visibility") == "visible")
      {
        currentGUI.style("visibility","hidden");
        nextGUI.style("visibility","visible");

        locationState = "mercury-facts";
      }
    });
  }

  let mercuryBackButtons = this.document.getElementsByClassName("back-btn-mercury");
  if (body == "mercury")
  {
    if (locationState == "mercury-home")
    {
      let backButton = mercuryBackButtons[0];
      backButton.addEventListener('click', function()
      {
        let mercuryGUI = select('#mercury-home'); // Grabs GUI
        closeGUI(mercuryGUI);
      })
    }
    else if (locationState == "mercury-what-is")
    {
      let currentGUI = select("#mercury-what-is");
      let nextGUI = select("#mercury-home");
      let backButton = mercuryBackButtons[1];
      backButton.addEventListener('click', function()
      {
        backHome(body, currentGUI, nextGUI);
      })
    }
    else if (locationState == "mercury-inside")
    {
      let currentGUI = select("#mercury-inside");
      let nextGUI = select("#mercury-home");
    
      let svgGUI = select(".mercury-svg");
      let divSVG = select(".inside-svg .mercury-svg");
      let outerSVG = select(".outerArea .mercury-svg");
      let innerSVG = select(".mercury-svg .smallerLayer");

      let backButton = mercuryBackButtons[2];
      backButton.addEventListener('click', function()
      {
        backHome(body, currentGUI, nextGUI, svgGUI, divSVG, outerSVG, innerSVG);
      })
    }
    else if (locationState == "mercury-facts")
    {
      let currentGUI = select("#mercury-facts");
      let nextGUI = select("#mercury-home");
      let backButton = mercuryBackButtons[3];
      backButton.addEventListener('click', function()
      {
        backHome(body, currentGUI, nextGUI);
      })
    }
  }



  // Venus Functions
  let venusButton = this.document.getElementById('venus-highlight');
  venusButton.addEventListener('click', function() // If Venus is clicked
  {
    let venusGUI = select('#venus-home'); // Grabs GUI
    openGUI("venus-home", "venus", venusGUI)
  });

  let venusButtons = this.document.getElementsByClassName("btn-venus");
  if (body == "venus")
  {
    let whatIsButton = venusButtons[0];
    whatIsButton.addEventListener("click", function()
    {
      let currentGUI = select("#venus-home");
      let nextGUI = select("#venus-what-is");

      if (currentGUI.style("visibility") == "visible")
      {
        currentGUI.style("visibility","hidden");
        nextGUI.style("visibility","visible");

        locationState = "venus-what-is";
      }
    });

    let insideButton = venusButtons[1];
    insideButton.addEventListener("click", function()
    {
      let currentGUI = select("#venus-home");
      let nextGUI = select("#venus-inside");
      let svgGUI = select(".venus-svg");
      let divSVG = select(".inside-svg .venus-svg");
      let outerSVG = select(".outerArea .venus-svg");
      let innerSVG = select(".venus-svg .smallerLayer");

      if (currentGUI.style("visibility") == "visible")
      {
        currentGUI.style("visibility","hidden");
        nextGUI.style("visibility","visible");
        svgGUI.style("visibility","visible");
        divSVG.style("visibility","visible");
        outerSVG.style("visibility","visible");
        innerSVG.style("visibility","visible");

        locationState = "venus-inside";
      }
    });

    let factsButton = venusButtons[2];
    factsButton.addEventListener("click", function()
    {
      let currentGUI = select("#venus-home");
      let nextGUI = select("#venus-facts");

      if (currentGUI.style("visibility") == "visible")
      {
        currentGUI.style("visibility","hidden");
        nextGUI.style("visibility","visible");

        locationState = "venus-facts";
      }
    });
  }

  let venusBackButtons = this.document.getElementsByClassName("back-btn-venus");
  if (body == "venus")
  {
    if (locationState == "venus-home")
    {
      let backButton = venusBackButtons[0];
      backButton.addEventListener('click', function()
      {
        let venusGUI = select('#venus-home'); // Grabs GUI
        closeGUI(venusGUI);
      })
    }
    else if (locationState == "venus-what-is")
    {
      let currentGUI = select("#venus-what-is");
      let nextGUI = select("#venus-home");
      let backButton = venusBackButtons[1];
      backButton.addEventListener('click', function()
      {
        backHome(body, currentGUI, nextGUI);
      })
    }
    else if (locationState == "venus-inside")
    {
      let currentGUI = select("#venus-inside");
      let nextGUI = select("#venus-home");

      let svgGUI = select(".venus-svg");
      let divSVG = select(".inside-svg .venus-svg");
      let outerSVG = select(".outerArea .venus-svg");
      let innerSVG = select(".venus-svg .smallerLayer");

      let backButton = venusBackButtons[2];
      backButton.addEventListener('click', function()
      {
        backHome(body, currentGUI, nextGUI, svgGUI, divSVG, outerSVG, innerSVG);
      })
    }
    else if (locationState == "venus-facts")
    {
      let currentGUI = select("#venus-facts");
      let nextGUI = select("#venus-home");
      let backButton = venusBackButtons[3];
      backButton.addEventListener('click', function()
      {
        backHome(body, currentGUI, nextGUI);
      })
    }
  }



  // Earth Functions
  let earthButton = this.document.getElementById('earth-highlight');
  earthButton.addEventListener('click', function() // If Earth is clicked
  {
    let earthGUI = select('#earth-home'); // Grabs GUI
    openGUI("earth-home", "earth", earthGUI)
  });

  let earthButtons = this.document.getElementsByClassName("btn-earth");
  if (body == "earth")
  {
    let whatIsButton = earthButtons[0];
    whatIsButton.addEventListener("click", function()
    {
      let currentGUI = select("#earth-home");
      let nextGUI = select("#earth-what-is");

      if (currentGUI.style("visibility") == "visible")
      {
        currentGUI.style("visibility","hidden");
        nextGUI.style("visibility","visible");

        locationState = "earth-what-is";
      }
    });

    let insideButton = earthButtons[1];
    insideButton.addEventListener("click", function()
    {
      let currentGUI = select("#earth-home");
      let nextGUI = select("#earth-inside");

      let svgGUI = select(".earth-svg");
      let divSVG = select(".inside-svg .earth-svg");
      let outerSVG = select(".outerArea .earth-svg");
      let innerSVG = select(".earth-svg .smallerLayer");

      if (currentGUI.style("visibility") == "visible")
      {
        currentGUI.style("visibility","hidden");
        nextGUI.style("visibility","visible");
        svgGUI.style("visibility","visible");
        divSVG.style("visibility","visible");
        outerSVG.style("visibility","visible");
        innerSVG.style("visibility","visible");

        locationState = "earth-inside";
      }
    });

    let factsButton = earthButtons[2];
    factsButton.addEventListener("click", function()
    {
      let currentGUI = select("#earth-home");
      let nextGUI = select("#earth-facts");

      if (currentGUI.style("visibility") == "visible")
      {
        currentGUI.style("visibility","hidden");
        nextGUI.style("visibility","visible");

        locationState = "earth-facts";
      }
    });
  }

  let earthBackButtons = this.document.getElementsByClassName("back-btn-earth");
  if (body == "earth")
  {
    if (locationState == "earth-home")
    {
      let backButton = earthBackButtons[0];
      backButton.addEventListener('click', function()
      {
        let earthGUI = select('#earth-home'); // Grabs GUI
        closeGUI(earthGUI);
      })
    }
    else if (locationState == "earth-what-is")
    {
      let currentGUI = select("#earth-what-is");
      let nextGUI = select("#earth-home");
      let backButton = earthBackButtons[1];
      backButton.addEventListener('click', function()
      {
        backHome(body, currentGUI, nextGUI);
      })
    }
    else if (locationState == "earth-inside")
    {
      let currentGUI = select("#earth-inside");
      let nextGUI = select("#earth-home");

      let svgGUI = select(".earth-svg");
      let divSVG = select(".inside-svg .earth-svg");
      let outerSVG = select(".outerArea .earth-svg");
      let innerSVG = select(".earth-svg .smallerLayer");

      let backButton = earthBackButtons[2];
      backButton.addEventListener('click', function()
      {
        backHome(body, currentGUI, nextGUI, svgGUI, divSVG, outerSVG, innerSVG);
      })
    }
    else if (locationState == "earth-facts")
    {
      let currentGUI = select("#earth-facts");
      let nextGUI = select("#earth-home");
      let backButton = earthBackButtons[3];
      backButton.addEventListener('click', function()
      {
        backHome(body, currentGUI, nextGUI);
      })
    }
  }



  // Mars Functions
  let marsButton = this.document.getElementById('mars-highlight');
  marsButton.addEventListener('click', function() // If Mars is clicked
  {
    let marsGUI = select('#mars-home'); // Grabs GUI
    openGUI("mars-home", "mars", marsGUI)
  });

  let marsButtons = this.document.getElementsByClassName("btn-mars");
  if (body == "mars")
  {
    let whatIsButton = marsButtons[0];
    whatIsButton.addEventListener("click", function()
    {
      let currentGUI = select("#mars-home");
      let nextGUI = select("#mars-what-is");

      if (currentGUI.style("visibility") == "visible")
      {
        currentGUI.style("visibility","hidden");
        nextGUI.style("visibility","visible");

        locationState = "mars-what-is";
      }
    });

    let insideButton = marsButtons[1];
    insideButton.addEventListener("click", function()
    {
      let currentGUI = select("#mars-home");
      let nextGUI = select("#mars-inside");

      let svgGUI = select(".mars-svg");
      let divSVG = select(".inside-svg .mars-svg");

      if (currentGUI.style("visibility") == "visible")
      {
        currentGUI.style("visibility","hidden");
        nextGUI.style("visibility","visible");
        svgGUI.style("visibility","visible");
        divSVG.style("visibility","visible");

        locationState = "mars-inside";
      }
    });

    let factsButton = marsButtons[2];
    factsButton.addEventListener("click", function()
    {
      let currentGUI = select("#mars-home");
      let nextGUI = select("#mars-facts");

      if (currentGUI.style("visibility") == "visible")
      {
        currentGUI.style("visibility","hidden");
        nextGUI.style("visibility","visible");

        locationState = "mars-facts";
      }
    });
  }

  let marsBackButtons = this.document.getElementsByClassName("back-btn-mars");
  if (body == "mars")
  {
    if (locationState == "mars-home")
    {
      let backButton = marsBackButtons[0];
      backButton.addEventListener('click', function()
      {
        let marsGUI = select('#mars-home'); // Grabs GUI
        closeGUI(marsGUI);
      })
    }
    else if (locationState == "mars-what-is")
    {
      let currentGUI = select("#mars-what-is");
      let nextGUI = select("#mars-home");
      let backButton = marsBackButtons[1];
      backButton.addEventListener('click', function()
      {
        backHome(body, currentGUI, nextGUI);
      })
    }
    else if (locationState == "mars-inside")
    {
      let currentGUI = select("#mars-inside");
      let nextGUI = select("#mars-home");

      let svgGUI = select(".mars-svg");
      let divSVG = select(".inside-svg .mars-svg");

      let backButton = marsBackButtons[2];
      backButton.addEventListener('click', function()
      {
        backHome(body, currentGUI, nextGUI, svgGUI, divSVG);
      })
    }
    else if (locationState == "mars-facts")
    {
      let currentGUI = select("#mars-facts");
      let nextGUI = select("#mars-home");
      let backButton = marsBackButtons[3];
      backButton.addEventListener('click', function()
      {
        backHome(body, currentGUI, nextGUI);
      })
    }
  }



  // Jupiter Functions
  let jupiterButton = this.document.getElementById('jupiter-highlight');
  jupiterButton.addEventListener('click', function() // If Jupiter is clicked
  {
    let jupiterGUI = select('#jupiter-home'); // Grabs GUI
    openGUI("jupiter-home", "jupiter", jupiterGUI);
  });

  let jupiterButtons = this.document.getElementsByClassName("btn-jupiter");
  if (body == "jupiter")
  {
    let whatIsButton = jupiterButtons[0];
    whatIsButton.addEventListener("click", function()
    {
      let currentGUI = select("#jupiter-home");
      let nextGUI = select("#jupiter-what-is");

      if (currentGUI.style("visibility") == "visible")
      {
        currentGUI.style("visibility","hidden");
        nextGUI.style("visibility","visible");

        locationState = "jupiter-what-is";
      }
    });

    let insideButton = jupiterButtons[1];
    insideButton.addEventListener("click", function()
    {
      let currentGUI = select("#jupiter-home");
      let nextGUI = select("#jupiter-inside");

      let svgGUI = select(".jupiter-svg");
      let divSVG = select(".inside-svg .jupiter-svg");
      let outerSVG = select(".outerArea .jupiter-svg");
      let innerSVG = select(".jupiter-svg .smallerLayer");

      if (currentGUI.style("visibility") == "visible")
      {
        currentGUI.style("visibility","hidden");
        nextGUI.style("visibility","visible");
        svgGUI.style("visibility","visible");
        divSVG.style("visibility","visible");
        outerSVG.style("visibility","visible");
        innerSVG.style("visibility","visible");

        locationState = "jupiter-inside";
      }
    });

    let factsButton = jupiterButtons[2];
    factsButton.addEventListener("click", function()
    {
      let currentGUI = select("#jupiter-home");
      let nextGUI = select("#jupiter-facts");

      if (currentGUI.style("visibility") == "visible")
      {
        currentGUI.style("visibility","hidden");
        nextGUI.style("visibility","visible");

        locationState = "jupiter-facts";
      }
    });
  }

  let jupiterBackButtons = this.document.getElementsByClassName("back-btn-jupiter");
  if (body == "jupiter")
  {
    if (locationState == "jupiter-home")
    {
      let backButton = jupiterBackButtons[0];
      backButton.addEventListener('click', function()
      {
        let jupiterGUI = select('#jupiter-home'); // Grabs GUI
        closeGUI(jupiterGUI);
      })
    }
    else if (locationState == "jupiter-what-is")
    {
      let currentGUI = select("#jupiter-what-is");
      let nextGUI = select("#jupiter-home");
      let backButton = jupiterBackButtons[1];
      backButton.addEventListener('click', function()
      {
        backHome(body, currentGUI, nextGUI);
      })
    }
    else if (locationState == "jupiter-inside")
    {
      let currentGUI = select("#jupiter-inside");
      let nextGUI = select("#jupiter-home");

      let svgGUI = select(".jupiter-svg");
      let divSVG = select(".inside-svg .jupiter-svg");
      let outerSVG = select(".outerArea .jupiter-svg");
      let innerSVG = select(".jupiter-svg .smallerLayer");

      let backButton = jupiterBackButtons[2];
      backButton.addEventListener('click', function()
      {
        backHome(body, currentGUI, nextGUI, svgGUI, divSVG, outerSVG, innerSVG);
      })
    }
    else if (locationState == "jupiter-facts")
    {
      let currentGUI = select("#jupiter-facts");
      let nextGUI = select("#jupiter-home");
      let backButton = jupiterBackButtons[3];
      backButton.addEventListener('click', function()
      {
        backHome(body, currentGUI, nextGUI);
      })
    }
  }



  // Saturn Functions
  let saturnButton = this.document.getElementById('saturn-highlight');
  saturnButton.addEventListener('click', function() // If Saturn is clicked
  {
    let saturnGUI = select('#saturn-home'); // Grabs GUI
    openGUI("saturn-home", "saturn", saturnGUI)
  });

  let saturnButtons = this.document.getElementsByClassName("btn-saturn");
  if (body == "saturn")
  {
    let whatIsButton = saturnButtons[0];
    whatIsButton.addEventListener("click", function()
    {
      let currentGUI = select("#saturn-home");
      let nextGUI = select("#saturn-what-is");

      if (currentGUI.style("visibility") == "visible")
      {
        currentGUI.style("visibility","hidden");
        nextGUI.style("visibility","visible");
        

        locationState = "saturn-what-is";
      }
    });

    let insideButton = saturnButtons[1];
    insideButton.addEventListener("click", function()
    {
      let currentGUI = select("#saturn-home");
      let nextGUI = select("#saturn-inside");

      let svgGUI = select(".saturn-svg");
      let divSVG = select(".inside-svg .saturn-svg");
      let outerSVG = select(".outerArea .saturn-svg");
      let innerSVG = select(".saturn-svg .smallerLayer");

      if (currentGUI.style("visibility") == "visible")
      {
        currentGUI.style("visibility","hidden");
        nextGUI.style("visibility","visible");
        svgGUI.style("visibility","visible");
        divSVG.style("visibility","visible");
        outerSVG.style("visibility","visible");
        innerSVG.style("visibility","visible");

        locationState = "saturn-inside";
      }
    });

    let factsButton = saturnButtons[2];
    factsButton.addEventListener("click", function()
    {
      let currentGUI = select("#saturn-home");
      let nextGUI = select("#saturn-facts");

      if (currentGUI.style("visibility") == "visible")
      {
        currentGUI.style("visibility","hidden");
        nextGUI.style("visibility","visible");

        locationState = "saturn-facts";
      }
    });
  }

  let saturnBackButtons = this.document.getElementsByClassName("back-btn-saturn");
  if (body == "saturn")
  {
    if (locationState == "saturn-home")
    {
      let backButton = saturnBackButtons[0];
      backButton.addEventListener('click', function()
      {
        let saturnGUI = select('#saturn-home'); // Grabs GUI
        closeGUI(saturnGUI);
      })
    }
    else if (locationState == "saturn-what-is")
    {
      let currentGUI = select("#saturn-what-is");
      let nextGUI = select("#saturn-home");
      let backButton = saturnBackButtons[1];
      backButton.addEventListener('click', function()
      {
        backHome(body, currentGUI, nextGUI);
      })
    }
    else if (locationState == "saturn-inside")
    {
      let currentGUI = select("#saturn-inside");
      let nextGUI = select("#saturn-home");

      let svgGUI = select(".saturn-svg");
      let divSVG = select(".inside-svg .saturn-svg");
      let outerSVG = select(".outerArea .saturn-svg");
      let innerSVG = select(".saturn-svg .smallerLayer");

      let backButton = saturnBackButtons[2];
      backButton.addEventListener('click', function()
      {
        backHome(body, currentGUI, nextGUI, svgGUI, divSVG, outerSVG, innerSVG);
      })
    }
    else if (locationState == "saturn-facts")
    {
      let currentGUI = select("#saturn-facts");
      let nextGUI = select("#saturn-home");
      let backButton = saturnBackButtons[3];
      backButton.addEventListener('click', function()
      {
        backHome(body, currentGUI, nextGUI);
      })
    }
  }



  // Uranus Functions
  let uranusButton = this.document.getElementById('uranus-highlight');
  uranusButton.addEventListener('click', function() // If Uranus is clicked
  {
    let uranusGUI = select('#uranus-home'); // Grabs GUI
    openGUI("uranus-home", "uranus", uranusGUI)
  });

  let uranusButtons = this.document.getElementsByClassName("btn-uranus");
  if (body == "uranus")
  {
    let whatIsButton = uranusButtons[0];
    whatIsButton.addEventListener("click", function()
    {
      let currentGUI = select("#uranus-home");
      let nextGUI = select("#uranus-what-is");

      if (currentGUI.style("visibility") == "visible")
      {
        currentGUI.style("visibility","hidden");
        nextGUI.style("visibility","visible");

        locationState = "uranus-what-is";
      }
    });

    let insideButton = uranusButtons[1];
    insideButton.addEventListener("click", function()
    {
      let currentGUI = select("#uranus-home");
      let nextGUI = select("#uranus-inside");

      let svgGUI = select(".uranus-svg");
      let divSVG = select(".inside-svg .uranus-svg");
      let outerSVG = select(".outerArea .uranus-svg");
      let innerSVG = select(".uranus-svg .smallerLayer");

      if (currentGUI.style("visibility") == "visible")
      {
        currentGUI.style("visibility","hidden");
        nextGUI.style("visibility","visible");
        svgGUI.style("visibility","visible");
        divSVG.style("visibility","visible");
        outerSVG.style("visibility","visible");
        innerSVG.style("visibility","visible");

        locationState = "uranus-inside";
      }
    });

    let factsButton = uranusButtons[2];
    factsButton.addEventListener("click", function()
    {
      let currentGUI = select("#uranus-home");
      let nextGUI = select("#uranus-facts");

      if (currentGUI.style("visibility") == "visible")
      {
        currentGUI.style("visibility","hidden");
        nextGUI.style("visibility","visible");

        locationState = "uranus-facts";
      }
    });
  }

  let uranusBackButtons = this.document.getElementsByClassName("back-btn-uranus");
  if (body == "uranus")
  {
    if (locationState == "uranus-home")
    {
      let backButton = uranusBackButtons[0];
      backButton.addEventListener('click', function()
      {
        let uranusGUI = select('#uranus-home'); // Grabs GUI
        closeGUI(uranusGUI);
      })
    }
    else if (locationState == "uranus-what-is")
    {
      let currentGUI = select("#uranus-what-is");
      let nextGUI = select("#uranus-home");
      let backButton = uranusBackButtons[1];
      backButton.addEventListener('click', function()
      {
        backHome(body, currentGUI, nextGUI);
      })
    }
    else if (locationState == "uranus-inside")
    {
      let currentGUI = select("#uranus-inside");
      let nextGUI = select("#uranus-home");

      let svgGUI = select(".uranus-svg");
      let divSVG = select(".inside-svg .uranus-svg");
      let outerSVG = select(".outerArea .uranus-svg");
      let innerSVG = select(".uranus-svg .smallerLayer");

      let backButton = uranusBackButtons[2];
      backButton.addEventListener('click', function()
      {
        backHome(body, currentGUI, nextGUI, svgGUI, divSVG, outerSVG, innerSVG);
      })
    }
    else if (locationState == "uranus-facts")
    {
      let currentGUI = select("#uranus-facts");
      let nextGUI = select("#uranus-home");
      let backButton = uranusBackButtons[3];
      backButton.addEventListener('click', function()
      {
        backHome(body, currentGUI, nextGUI);
      })
    }
  }



  // Neptune Functions
  let neptuneButton = this.document.getElementById('neptune-highlight');
  neptuneButton.addEventListener('click', function() // If Neptune is clicked
  {
    let neptuneGUI = select('#neptune-home'); // Grabs GUI
    openGUI("neptune-home", "neptune", neptuneGUI)
  });

  let neptuneButtons = this.document.getElementsByClassName("btn-neptune");
  if (body == "neptune")
  {
    let whatIsButton = neptuneButtons[0];
    whatIsButton.addEventListener("click", function()
    {
      let currentGUI = select("#neptune-home");
      let nextGUI = select("#neptune-what-is");

      if (currentGUI.style("visibility") == "visible")
      {
        currentGUI.style("visibility","hidden");
        nextGUI.style("visibility","visible");

        locationState = "neptune-what-is";
      }
    });

    let insideButton = neptuneButtons[1];
    insideButton.addEventListener("click", function()
    {
      let currentGUI = select("#neptune-home");
      let nextGUI = select("#neptune-inside");
      let svgGUI = select(".neptune-svg");
      let divSVG = select(".inside-svg .neptune-svg");
      let outerSVG = select(".outerArea .neptune-svg");
      let innerSVG = select(".neptune-svg .smallerLayer");

      if (currentGUI.style("visibility") == "visible")
      {
        currentGUI.style("visibility","hidden");
        nextGUI.style("visibility","visible");
        svgGUI.style("visibility","visible");
        divSVG.style("visibility","visible");
        outerSVG.style("visibility","visible");
        innerSVG.style("visibility","visible");

        locationState = "neptune-inside";
      }
    });

    let factsButton = neptuneButtons[2];
    factsButton.addEventListener("click", function()
    {
      let currentGUI = select("#neptune-home");
      let nextGUI = select("#neptune-facts");

      if (currentGUI.style("visibility") == "visible")
      {
        currentGUI.style("visibility","hidden");
        nextGUI.style("visibility","visible");

        locationState = "neptune-facts";
      }
    });
  }

  let neptuneBackButtons = this.document.getElementsByClassName("back-btn-neptune");
  if (body == "neptune")
  {
    if (locationState == "neptune-home")
    {
      let backButton = neptuneBackButtons[0];
      backButton.addEventListener('click', function()
      {
        let neptuneGUI = select('#neptune-home'); // Grabs GUI
        closeGUI(neptuneGUI);
      })
    }
    else if (locationState == "neptune-what-is")
    {
      let currentGUI = select("#neptune-what-is");
      let nextGUI = select("#neptune-home");
      let backButton = neptuneBackButtons[1];
      backButton.addEventListener('click', function()
      {
        backHome(body, currentGUI, nextGUI);
      })
    }
    else if (locationState == "neptune-inside")
    {
      let currentGUI = select("#neptune-inside");
      let nextGUI = select("#neptune-home");

      let svgGUI = select(".neptune-svg");
      let divSVG = select(".inside-svg .neptune-svg");
      let outerSVG = select(".outerArea .neptune-svg");
      let innerSVG = select(".neptune-svg .smallerLayer");

      let backButton = neptuneBackButtons[2];
      backButton.addEventListener('click', function()
      {
        backHome(body, currentGUI, nextGUI, svgGUI, divSVG, outerSVG, innerSVG);
      })
    }
    else if (locationState == "neptune-facts")
    {
      let currentGUI = select("#neptune-facts");
      let nextGUI = select("#neptune-home");
      let backButton = neptuneBackButtons[3];
      backButton.addEventListener('click', function()
      {
        backHome(body, currentGUI, nextGUI);
      })
    }
  }



  // Pluto Functions
  let plutoButton = this.document.getElementById('pluto-highlight');
  plutoButton.addEventListener('click', function() // If Pluto is clicked
  {
    let plutoGUI = select('#pluto-home'); // Grabs GUI
    openGUI("pluto-home", "pluto", plutoGUI)
  });

  let plutoButtons = this.document.getElementsByClassName("btn-pluto");
  if (body == "pluto")
  {
    let whatIsButton = plutoButtons[0];
    whatIsButton.addEventListener("click", function()
    {
      let currentGUI = select("#pluto-home");
      let nextGUI = select("#pluto-what-is");

      if (currentGUI.style("visibility") == "visible")
      {
        currentGUI.style("visibility","hidden");
        nextGUI.style("visibility","visible");

        locationState = "pluto-what-is";
      }
    });

    let insideButton = plutoButtons[1];
    insideButton.addEventListener("click", function()
    {
      let currentGUI = select("#pluto-home");
      let nextGUI = select("#pluto-inside");

      let svgGUI = select(".pluto-svg");
      let divSVG = select(".inside-svg .pluto-svg");
      let outerSVG = select(".outerArea .pluto-svg");
      let innerSVG = select(".pluto-svg .smallerLayer");

      if (currentGUI.style("visibility") == "visible")
      {
        currentGUI.style("visibility","hidden");
        nextGUI.style("visibility","visible");
        svgGUI.style("visibility","visible");
        divSVG.style("visibility","visible");
        outerSVG.style("visibility","visible");
        innerSVG.style("visibility","visible");

        locationState = "pluto-inside";
      }
    });

    let factsButton = plutoButtons[2];
    factsButton.addEventListener("click", function()
    {
      let currentGUI = select("#pluto-home");
      let nextGUI = select("#pluto-facts");

      if (currentGUI.style("visibility") == "visible")
      {
        currentGUI.style("visibility","hidden");
        nextGUI.style("visibility","visible");

        locationState = "pluto-facts";
      }
    });
  }

  let plutoBackButtons = this.document.getElementsByClassName("back-btn-pluto");
  if (body == "pluto")
  {
    if (locationState == "pluto-home")
    {
      let backButton = plutoBackButtons[0];
      backButton.addEventListener('click', function()
      {
        let neptuneGUI = select('#pluto-home'); // Grabs GUI
        closeGUI(neptuneGUI);
      })
    }
    else if (locationState == "pluto-what-is")
    {
      let currentGUI = select("#pluto-what-is");
      let nextGUI = select("#pluto-home");
      let backButton = plutoBackButtons[1];
      backButton.addEventListener('click', function()
      {
        backHome(body, currentGUI, nextGUI);
      })
    }
    else if (locationState == "pluto-inside")
    {
      let currentGUI = select("#pluto-inside");
      let nextGUI = select("#pluto-home");

      let svgGUI = select(".pluto-svg");
      let divSVG = select(".inside-svg .pluto-svg");
      let outerSVG = select(".outerArea .pluto-svg");
      let innerSVG = select(".pluto-svg .smallerLayer");

      let backButton = plutoBackButtons[2];
      backButton.addEventListener('click', function()
      {
        backHome(body, currentGUI, nextGUI, svgGUI, divSVG, outerSVG, innerSVG);
      })
    }
    else if (locationState == "pluto-facts")
    {
      let currentGUI = select("#pluto-facts");
      let nextGUI = select("#pluto-home");
      let backButton = plutoBackButtons[3];
      backButton.addEventListener('click', function()
      {
        backHome(body, currentGUI, nextGUI);
      })
    }
  }
}



// The function that allows separation of SVG layers of bodies interaction
function layersInteractivity(svgBody, outerLeft, outerWidth, innerLeft, innerWidth)
{
  var table = document.querySelector(svgBody + " .outerArea");
  var areas = document.querySelectorAll(svgBody + " .innerArea");

  Draggable.create(document.querySelector(svgBody + " .biggerLayer"), // For larger layers
  {
    type: "x",
    bounds: {left: outerLeft, width: outerWidth}
  })

  Draggable.create(document.querySelector(svgBody + " .smallerLayer"),  // For smaller layers
  {
    type: "x",
    bounds: {left: innerLeft, width: innerWidth},
    onPress(event) 
    {
      event.stopPropagation();
      this.update();
    },
    onDragEnd() // Checks if the layer is near the bigger layer to connect back together
    {
      var target = this.target;
      
      let newParent = table;
      var oldParent = target.parentElement;
      
      for (let i = 0; i < areas.length; i++) 
      {
        var area = areas[i];
        
        if (this.hitTest(area, "51%")) 
        {
          newParent = area;
          break;
        }
      }
      
      // Animates the position of the smaller layer to connect to the larger layer
      newParent.append(target);
      
      var a = newParent.getBoundingClientRect();
      var b = oldParent.getBoundingClientRect();
      
      var x = this.x + (b.left - a.left);
      var y = this.y + (b.top - a.top);
          
      gsap.set(target, { x, y });
      
      if (newParent !== table) 
      {
        gsap.to(target,
        {
          x: 0,
          y: 0
        })
      }    
    }
  })
}



// Opens any GUI
// - newState: updates the user's location
// - newBody: updates the user's body location
function openGUI(newState, newBody, GUI)
{
  if ((locationState == "space") && (GUI.style('visibility') == 'hidden')) 
    {
      svg.style["pointer-events"] = "none";
      GUI.style('visibility','visible');
      locationState = newState;
      actionState = "inBody";
      body = newBody;
    } 
}

// Returns back to home page
// - currentBody: the current body the user is on
// - currentGUI: the current GUI the user is on
// - nextGUI: the next GUI the user will be on
// - svgGUI / divSVG / outerSVG / innerSVG: various sections of the interactive SVGs
function backHome(currentBody, currentGUI, nextGUI, svgGUI, divSVG, outerSVG, innerSVG)
{
  if (currentGUI.style("visibility") == "visible")
  {
    currentGUI.style("visibility","hidden");
    nextGUI.style("visibility","visible");
    
    if (svgGUI)
    {
      svgGUI.style("visibility","hidden");
    }
    if (divSVG)
    {
      divSVG.style("visibility","hidden");
    }
    if (outerSVG)
    {
      outerSVG.style("visibility","hidden");
    }
    if (innerSVG)
    {
      innerSVG.style("visibility","hidden");
    }

    if (currentBody == "sun")
    {
      locationState = "sun-home";
    }
    else if (currentBody == "mercury")
    {
      locationState = "mercury-home";
    }
    else if (currentBody == "venus")
    {
      locationState = "venus-home";
    }
    else if (currentBody == "earth")
    {
      locationState = "earth-home";
    }
    else if (currentBody == "mars")
    {
      locationState = "mars-home";
    }
    else if (currentBody == "jupiter")
    {
      locationState = "jupiter-home";
    }
    else if (currentBody == "saturn")
    {
      locationState = "saturn-home";
    }
    else if (currentBody == "uranus")
    {
      locationState = "uranus-home";
    }
    else if (currentBody == "neptune")
    {
      locationState = "neptune-home";
    }
  }
}

// Closes GUI back to the Solar System
// - currentGUI: the current GUI the user is on (always home page)
function closeGUI(currentGUI)
{
  if (currentGUI.style('visibility') == 'visible')
  {
    svg.style["pointer-events"] = "auto";
    currentGUI.style('visibility','hidden');

    actionState = "none";
    locationState = "space";
    body = null;
  }
}