import React, { useEffect } from "react";
import NavBanner from "./NavBanner";

import TutorialMiniCard from "./TutorialMiniCard";
import { EmptyProps, assertNever } from "../utils";
import { useStoreActions, useStoreState } from "../store";
import { urlWithinApp } from "../env-utils";
import { Link } from "./LinkWithinApp";
import { pytchResearchSiteUrl } from "../constants";
import { useSetActiveUiVersionFun } from "./hooks/active-ui-version";
import { EditorKindThumbnail } from "./EditorKindThumbnail";


const ToggleUiStylePanel_v1: React.FC<EmptyProps> = () => {
  const setUiVersion2 = useSetActiveUiVersionFun("v2");
  return (
    <aside className="ToggleUiStylePanel">
      <div className="summary">
        <EditorKindThumbnail programKind="per-method" size="lg" />
        <div className="content">
          <p>
            We’re excited to invite you to try a new way of writing Pytch
            programs — script by script.
          </p>
        </div>
      </div>
      <div className="explanation">
        <p className="welcome-change-ui-style">
          <span className="pseudo-link" onClick={setUiVersion2}>
            Try it!
          </span>
        </p>
      </div>
    </aside>
  );
};

const ToggleUiStylePanel_v2: React.FC<EmptyProps> = () => {
  const setUiVersion1 = useSetActiveUiVersionFun("v1");
  const createNewProjectAndNavigate = useStoreActions(
    (actions) => actions.projectCollection.createNewProjectAndNavigate
  );
  const createProjectFromTutorialAction = useStoreActions(
    (actions) => actions.tutorialCollection.createProjectFromTutorial
  );
  const setOperationState = useStoreActions(
    (actions) => actions.versionOptIn.setV2OperationState
  );

  // Bit of a fudge to manage the "operation in progress" state in the
  // next two functions, but it's likely to be temporary and so not
  // really worth making general.

  const createProject = async () => {
    setOperationState("in-progress");
    await createNewProjectAndNavigate({
      name: "Untitled script-by-script project",
      template: "simple-example-per-method",
    });
    setOperationState("idle");
  };

  const createProjectFromTutorial = async () => {
    setOperationState("in-progress");
    await createProjectFromTutorialAction("script-by-script-catch-apple");
    setOperationState("idle");
  };



 


  return (
    <div className="ToggleUiStylePanel">
      <div className="summary">
        <EditorKindThumbnail programKind="per-method" size="lg" />
        <div className="content">
          <p>
            Thanks for trying the <em>script by script</em> way of writing Pytch
            programs. Let us know what you think!
          </p>
        </div>
      </div>
      <div className="explanation">
        <p>You can try the new version by:</p>
        <ul>
          <li>
            <span className="pseudo-link" onClick={createProject}>
              Creating a project
            </span>{" "}
            which you edit as sprites and scripts.
          </li>
          <li>
            <span className="pseudo-link" onClick={createProjectFromTutorial}>
              Working with a tutorial
            </span>{" "}
            which leads you through writing a game as sprites and scripts.
          </li>
        </ul>
        <p>
          (Or you can{" "}
          <span className="pseudo-link" onClick={setUiVersion1}>
            go back to classic Pytch
          </span>
          .)
        </p>
      </div>
    </div>
  );
};

const ToggleUiStylePanel: React.FC<EmptyProps> = () => {
  const activeUiVersion = useStoreState(
    (state) => state.versionOptIn.activeUiVersion
  );

  switch (activeUiVersion) {
    case "v1":
      return <ToggleUiStylePanel_v1 />;
    case "v2":
      return <ToggleUiStylePanel_v2 />;
    default:
      return assertNever(activeUiVersion);
  }
};





const Welcome: React.FC<EmptyProps> = () => {
  // TODO: Replace the hard-coded list of tutorial mini-cards with something
  // driven by the pytch-tutorials repo.

  useEffect(() => {
    document.title = "Pytch";

    function toggleNav() {
      console.log("menu");
      const navUl = document.querySelector("nav ul");
      
      navUl.classList.toggle("show");
      console.log(navUl);
    }

    document.querySelector(".hamburger-menu").addEventListener("click", toggleNav);
    
    
    
    const screen_small = window.matchMedia("(max-width: 800px)");
    const screen_medium = window.matchMedia("(max-width: 1100px)");
    
    let cards = [];
    
    // Find all TutorialMiniCards (hope this isn't too much code smell)
    let tutorialMiniCards = document.querySelectorAll(".TutorialMiniCard");
    
    // Iterate through each element and build the object with node and children
    tutorialMiniCards.forEach((element) => {
      let nodeObject = {
        node: element,
        children: Array.from(element.children),
      };
    
      cards.push(nodeObject);
    });
    // Now cards contains the objects with node and children for each element with the class "TutorialMiniCard"
    console.log(cards);
    
    let current_window_size: number;
    
    function updateWindowSize() {
      let new_window_size;
    
      if (screen_small.matches) {
        new_window_size = 1;
      } else if (screen_medium.matches) {
        new_window_size = 2;
      } else {
        new_window_size = 3;
      }
    
      if (new_window_size !== current_window_size) {
        current_window_size = new_window_size;
        console.log("Window size changed to " + current_window_size);
        createCards(current_window_size);
      }
    }
    // Initial update of window_size
    updateWindowSize();
    
    // Add event listener for window resize
    window.addEventListener("resize", updateWindowSize);
    
    function createCards(window_size: number) {
      let window_position = 0;
    
      handleArrowKeyPress("ArrowRight"); // start Carousel
    
      document.addEventListener("keydown", (event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          // Handle right or left arrow key press
          handleArrowKeyPress(event.key);
        }
      });
    
      /* Handle left/right arrow click events */
      const rightArrowElement = document.querySelector(".right-arrow");
      if (rightArrowElement) {
        rightArrowElement.addEventListener("click", () => {
          handleArrowKeyPress("ArrowRight");
        });
      }
      const leftArrowElement = document.querySelector(".left-arrow");
      if (leftArrowElement) {
        leftArrowElement.addEventListener("click", () => {
          handleArrowKeyPress("ArrowLeft");
        });
      }
    
      function handleArrowKeyPress(key:string) {
        // Update the window_position based on the arrow key
        if (key === "ArrowRight") {
          window_position = (window_position - 1 + cards.length) % cards.length; // Decrement for left arrow
        } else if (key === "ArrowLeft") {
          window_position = (window_position + 1) % cards.length; // Increment for right arrow
        }
        //console.log(`Arrow key pressed: ${key}`);
        const tutorialCarousel = document.getElementById("TutorialCarousel");
    
        if (tutorialCarousel) {
          // Clear existing children
          tutorialCarousel.innerHTML = "";
    
          // Create a document fragment
          const fragment = document.createDocumentFragment();
          //console.log("____________________________________");
    
          for (let i = window_position, steps = window_size; steps > 0; steps--) {
            i = (i + 1) % cards.length; // Increment for any arrow
            //console.log(` ${i} `);
    
            // Append the child element to the fragment
            fragment.appendChild(cards[i].node);
            //console.log(cards[i]);
          }
    
          // Append the fragment to "TutorialCarousel" in a single operation
          tutorialCarousel.appendChild(fragment);
        } else {
          console.error("TutorialCarousel not found.");
        }
      }
    }
    
     // Get references to both modals and buttons. If we have more than 2 this should be changed.
     let modal = document.getElementById("myModal");
     let modal1 = document.getElementById("myModal1");

     
     // Get references to both buttons
     let btn = document.getElementById("myBtn");
     let btn1 = document.getElementById("myBtn1");
     
     // Get references to close buttons for both modals
     let closeButtons = document.querySelectorAll('.close');
     
     // Function to open the modal
     function openModal(modal) {
         modal.style.display = "block";
     }
     
     // Function to close the modal
     function closeModal(modal) {
         modal.style.display = "none";
     }
     
     // Add event listeners to buttons to open modals
     btn.addEventListener("click", function () {
         openModal(modal);
     });
     
     btn1.addEventListener("click", function () {
         openModal(modal1);
     });
     
     
     
     // Add click event listener to each close button
     closeButtons.forEach(function (button) {
         button.addEventListener('click', function () {
             // Run the provided code when the close button is clicked
             modal.style.display = "none";
             modal1.style.display = "none";
         });
     });
     
     // Close modals when clicking outside
     document.addEventListener("click", function (event) {
         if (event.target === modal) {
             console.log(event);
         } else if (event.target === modal1) {
             closeModal(modal1);
         }
     });


    






  });

  const scratchLogoUrl = urlWithinApp("/assets/scratch-logo.png");
  const pythonLogoUrl = urlWithinApp("/assets/python-logo.png");
  const logosUrl = urlWithinApp("/assets/Icon-02.png"); 
  const pytchUrl = urlWithinApp("/assets/pytch_org.png");
  const pytchjrUrl = urlWithinApp("/assets/pytch_jr.png");
  const invadersUrl = urlWithinApp("/assets/invaders.png");
  const backgroundUrl = urlWithinApp("/assets/IMG_20230511_182016_068-1-scaled-1.webp");
  const acknowledgementsUrl = urlWithinApp("/assets/organisation.png");

  const videoUrl = urlWithinApp("/assets/Overview.mp4");
  const launchCreate = useStoreActions(
    (actions) => actions.userConfirmations.createProjectInteraction.launch
  );
  const showCreateModal = () => launchCreate();

     

  return (
    // The style on the Python logo <img> is to make it the same width
    // as the Scratch logo, otherwise the text block is off-centre.
    <>
      <NavBanner />
      <header>
  <section>
    <h1>Welcome to Pytch!</h1>
    <p>Pytch is a bridge from Scratch to Python.</p>
    <p>
      It helps people to learn Python by building on skills they have developed
      in Scratch.
    </p>
  </section>
  <section className="subgrid-video">
    <button id="myBtn" aria-label="Video overview of Pytch">
      <svg
        fill="#fff"
        height="200px"
        width="200px"
        version="1.1"
        id="play_button"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        viewBox="0 0 60 60"
        style={{ width: 200 }}
      >
        <g>
          <title>Click here for an overview of Pytch!</title>
          <path
            d="M45.563,29.174l-22-15c-0.307-0.208-0.703-0.231-1.031-0.058C22.205,14.289,22,14.629,22,15v30
              c0,0.371,0.205,0.711,0.533,0.884C22.679,45.962,22.84,46,23,46c0.197,0,0.394-0.059,0.563-0.174l22-15
              C45.836,30.64,46,30.331,46,30S45.836,29.36,45.563,29.174z M24,43.107V16.893L43.225,30L24,43.107z"
          />
          <path
            d="M30,0C13.458,0,0,13.458,0,30s13.458,30,30,30s30-13.458,30-30S46.542,0,30,0z M30,58C14.561,58,2,45.439,2,30
              S14.561,2,30,2s28,12.561,28,28S45.439,58,30,58z"
          />
        </g>
      </svg>
      {/* svgrepo */}
    </button>
  </section>
  
</header>
<button id="myBtn1" className="rounded-button divider">
  &gt;&gt;&gt; Start your <br /> coding journey
</button>
<main>
<ToggleUiStylePanel />
        

        <h2>Featured projects</h2>

        <div style={{ display: "none" }} className="demo-cards">
          <TutorialMiniCard
            title="Catch a star"
            slug="chase"
            screenshotBasename="screenshot.png"
          >
            <p>
              In this introduction to coding in Pytch, you control a bird using
              the keyboard, and your job is to catch the star.
            </p>
          </TutorialMiniCard>

          <TutorialMiniCard
            title="Boing"
            slug="boing"
            screenshotBasename="summary-screenshot.png"
          >
            <p>
              In the game <i>Pong</i> from 1972, players hit a ball back and
              forth. Our <i>Boing</i> game, adapted from one in{" "}
              <a href="https://wireframe.raspberrypi.org/books/code-the-classics1">
                Code the Classics
              </a>
              , lets you play against the computer.
            </p>
          </TutorialMiniCard>

          <TutorialMiniCard
            title="Q*bert"
            slug="qbert"
            screenshotBasename="screenshot.png"
          >
            <p>
              Jump around a pyramid of blocks, trying to change the whole stack
              yellow without falling off! Our version is adapted from one in{" "}
              <a href="https://wireframe.raspberrypi.org/issues/42">
                Wireframe magazine
              </a>
              , inspired by the 1982 arcade classic.
            </p>
          </TutorialMiniCard>
        </div>
        <div className="outer-container">
  <div className="left-arrow">❬</div>
  <div id="TutorialCarousel">Next</div>
  <div className="right-arrow">❭</div>
</div>

  </main>
  <>
  <section className="easy">
    <div className="section-heading">
      <img src={logosUrl} alt="" className="section-logo" />
      <h2>
        Pytch<span role="presentation">_</span> in action
      </h2>
    </div>
    <div className="section-content">
      <div className="section-buttons">
        <p>
          Here you can see what the Pytch environment looks like - providing a
          single screen where students can code, run their programs, and choose
          resources from our media library.
        </p>
      </div>
      <div className="cbody">
        <div className="cmain">
          <div className="ccontentwrap">
            <div className="ccontent">
              <img className="ccont" src={invadersUrl} alt="" />
            </div>
          </div>
        </div>
        <div className="cbottom"></div>
        <div className="cleg"></div>
      </div>
    </div>
    <h2>Two ways of writing code</h2>
    <div className="section-content">
      <div>
        <img
          className="pytch_images"
          src={pytchjrUrl}
          width={512}
          height={360}
          alt="Pytch can be coded with script blocks"
        />
        <p>Script by script</p>
      </div>
      <div>
        <img
          className="pytch_images"
          src={pytchUrl}
          width={512}
          height={360}
          alt="Pytch can be coded as a single program"
        />
        <p>One big program</p>
      </div>
    </div>
  </section>
  <div className="section-buttons contact">
    <span style={{ paddingLeft: "5%" }}>
      <a className="mail" href="mailto:info@pytch.org">
        ✉
      </a>
    </span>
    {/* UTF-8 character for an envelope */}
    <p className="large-text">
      Please email us at{" "}
      <a style={{ color: "black !important" }} href="mailto:info@pytch.org">
        info@pytch.org
      </a>{" "}
      with any feedback or suggestions
    </p>
  </div>
  <footer className="site-footer">
    <div className="section-content">
      <div className="sitemap">
        <div className="list-container">
          <h2>
            Contact us<span role="presentation">_</span>
          </h2>
          <ul>
            <li>
              <a href="mailto:info@pytch.org">Email</a>
            </li>
            <li>
              <a href="https://twitter.com/pytchlang/">Twitter</a>
            </li>
          </ul>
        </div>
        <div className="list-container">
          <h2>
            About<span role="presentation">_</span>
          </h2>
          <ul>
            <li>
              <a href="https://pytch.scss.tcd.ie/who-we-are/">Our team</a>
            </li>
            <li>
              <a href="https://pytch.scss.tcd.ie/research/">Our research</a>
            </li>
          </ul>
        </div>
        <div className="list-container">
          <h2>
            For teachers<span role="presentation">_</span>
          </h2>
          <ul>
            <li><Link to="/tutorials/">Tutorials</Link></li>
            <li>
              <a href="https://pytch.scss.tcd.ie/lesson-plans/">Lesson plans</a>
            </li>
          </ul>
        </div>
        {/*
    <div class="list-container">
      <h2>Resources<span role="presentation">_</span></h2>
      <ul>
        <li><a href="https://www.pytch.org/doc/developer.html">Info for developers</a></li>
        <li><a href="https://www.pytch.org/doc/webapp/user/index.html">Help</a></li>
      </ul>
    </div>
    */}
      </div>
      <div className="section-images">
        <img src={acknowledgementsUrl} alt="Image 1" />
      </div>
    </div>
  </footer>
  <>
  <div id="myModal" className="wodal">
    {/* Modal content */}
    <div className="wodal-content">
      <button aria-label="Close" className="close">
        ×
      </button>
      <video className="ccont" controls data-toggle="lightbox">
        <source src={videoUrl} type="video/mp4" />
      </video>
    </div>
  </div>
  <div id="myModal1" className="wodal">
    {/* Modal content */}
    <h1 id="myModal1_header"> I want to ... </h1>
    <div className="wodal-content">
      <button aria-label="Close" className="close">
        ×
      </button>
      <div style={{ display: "flex" }}>
      <Link to="/tutorials/"><button className="square">
        Start learning from basics with guided help and tutorials
        </button></Link>
        <button onClick={showCreateModal}  className="square">
          Start a new project and work on my own
        </button>
        {/*
        <div class="square">
           <p>View sample projects and learn from them</p>
        </div>
        */}
      </div>
    </div>
  </div>
</>

</>
      
    </>
  );
};



export default Welcome;
