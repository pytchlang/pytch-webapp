import React, { useState, useEffect } from "react";
import TutorialMiniCard from "./TutorialMiniCard";
import { EmptyProps } from "../utils";


const TutorialCarousel: React.FC<EmptyProps> = () => {
  const [windowPosition, setWindowPosition] = useState(0);
  const [currentWindowSize, setCurrentWindowSize] = useState(3); // Default window size
  const cards: React.ReactNode[] = [];

  cards.push(
    <TutorialMiniCard
      key="catch"
      title="Catch a star"
      slug="catch"
      screenshotBasename="catch.png"
    >
      <p>
        In this introduction to coding in Pytch, you control a bird using
        the keyboard, and your job is to catch the star.
      </p>
    </TutorialMiniCard>
  );

  cards.push(
    <TutorialMiniCard
      key="boing"
      title="Boing"
      slug="boing"
      screenshotBasename="boing.png"
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
  );

  cards.push(
    <TutorialMiniCard
      key="qbert"
      title="Q*bert"
      slug="qbert"
      screenshotBasename="qbert.png"
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
  );

  cards.push(
    <TutorialMiniCard
      key="splat"
      title="Splat the moles"
      slug="splat"
      screenshotBasename="splat.png"
    >
      <p>
        A game where the player has to splat moles to score points. But if they miss, they lose all their points!
      </p>
    </TutorialMiniCard>
  );


  const handleArrowKeyPress = (event: any) => {
    if (event.key === 'ArrowLeft') {
      setWindowPosition((prevPosition) => (prevPosition - 1 + cards.length) % cards.length);
    } else if (event.key === 'ArrowRight') {
      setWindowPosition((prevPosition) => (prevPosition + 1) % cards.length);
    }
  };

  const handleArrowClick = (direction: String) => {
    if (direction === 'right') {
      handleArrowKeyPress({ key: 'ArrowRight' });
    } else if (direction === 'left') {
      handleArrowKeyPress({ key: 'ArrowLeft' });
    }
  };



  useEffect(() => {
    const screenSmall = window.matchMedia('(max-width: 800px)');
    const screenMedium = window.matchMedia('(max-width: 1100px)');

    const updateWindowSize = () => {
      if (screenSmall.matches) {
        setCurrentWindowSize(1);
      } else if (screenMedium.matches) {
        setCurrentWindowSize(2);
        console.log(" useeffect window update! ");
      } else {
        setCurrentWindowSize(3);
      }
    };

    // Call updateWindowSize once to set initial window size
    updateWindowSize();

    window.addEventListener('resize', updateWindowSize);

    return () => {
      window.removeEventListener('resize', updateWindowSize);
    };
  }, []);

  return (

    <div className="outer-container">
      <div className="left-arrow" onClick={() => handleArrowClick('left')}>&lt;</div>
      <div id="TutorialCarousel">
        {/* Render cards based on window position and size */}
        {[...cards.slice(windowPosition), ...cards.slice(0, windowPosition)] /* This line concatenates two slices of the cards array. 
                                                                              The first slice includes cards from windowPosition to the end of the array, 
                                                                              and the second slice includes cards from the beginning of the array up to 
                                                                              windowPosition. This creates the loop when approaching end of array. */
          .slice(0, currentWindowSize) // Adjust slice to only show the current window size
          .map((card, index) => card)}
      </div>
      <div className="right-arrow" onClick={() => handleArrowClick('right')}>&gt;</div>

    </div>

  );
};


export default TutorialCarousel;
