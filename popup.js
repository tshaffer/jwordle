const serverUrl = 'http://localhost:8000';
const versionUrl = serverUrl + '/api/v1/version';
const getWordsUrl = serverUrl + '/api/v1/getWordsEndpoint';
const testDataUrl = 'testData.json';
const runtimeTestDataUrl = chrome.runtime.getURL(testDataUrl);

getVersion(versionUrl);
getTestData(runtimeTestDataUrl);

chrome.tabs.query({ active: true, currentWindow: true })
  .then(([tab]) => {

    // let wordleEntry2 = document.getElementById("wordleEntry2");
    // // wordleEntry2.addEventListener("click", async () => {
    // //   console.log('wordleEntry2 clicked');
    // // });
    // wordleEntry2.onclick = () => {
    //   console.log('wordleEntry2 clicked');

    //   const enteredLines =
    //   {
    //     "enteredLines": [
    //       {
    //         "letters": "ARISE",
    //         "evaluations": [
    //           "present",
    //           "absent",
    //           "absent",
    //           "present",
    //           "present"
    //         ]
    //       },
    //       {
    //         "letters": "MOUND",
    //         "evaluations": [
    //           "absent",
    //           "absent",
    //           "absent",
    //           "absent",
    //           "correct"
    //         ]
    //       }
    //     ]
    //   };

    //   processEnteredLinesMessage(enteredLines.enteredLines, jwordleCallback)
    // };


    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: executeContentScript,
    });

    chrome.runtime.onMessage.addListener(
      function (request) {
        console.log('extension onMessage.addListener invoked, received:');
        console.log(request);
        /*
                export interface LetterTypes {
                  lettersAtExactLocation: string[];
                  lettersNotAtExactLocation: string[];
                  lettersNotInWord: string;
                }
        */

        processEnteredLinesMessage(request.enteredLines);
      }
    );

  });


function twordleCallback(candidateWords) {
  console.log(candidateWords);
  const candidateWordsList = document.getElementById('candidateWordsList');

  // clear previous items
  candidateWordsList.innerHTML = '';

  for (var i = 0; i < candidateWords.length; i++) {

    // Create the list item:
    var item = document.createElement('li');

    // Set its contents:
    item.appendChild(document.createTextNode(candidateWords[i]));

    // Add it to the list:
    candidateWordsList.appendChild(item);
  }
}

function jwordleCallback(candidateWords) {

  console.log('jwordleCallback: candidate words were');
  console.log(candidateWords);

  twordleCallback(candidateWords);

  let wordleEntry2 = document.getElementById("wordleEntry2");

  wordleEntry2.classList.toggle("active");
  var content = wordleEntry2.nextElementSibling;
  if (content.style.maxHeight) {
    content.style.maxHeight = null;
  } else {
    content.style.maxHeight = content.scrollHeight + "px";
  }
}

function processEnteredLinesMessage(enteredLines) {

  console.log('processEnteredLinesMessage');
  console.log(enteredLines);

  const letterTypes = getLetterTypes(enteredLines);
  console.log('letterTypes');
  console.log(letterTypes);

  for (let lineIndex = 0; lineIndex < enteredLines.length; lineIndex++) {

    const enteredLine = enteredLines[lineIndex].letters;
    console.log('enteredLine');
    console.log(enteredLine);

    console.log('divId');
    const divId = 'l' + lineIndex.toString();
    console.log(divId);

    // const divIdElement = document.getElementById(divId);

    if (enteredLine.length > 0) {
      // divIdElement.setAttribute("class", "blockDiv");
      const evaluations = enteredLines[lineIndex].evaluations; // array of 5 of absent, present, or correct
      for (let letterIndex = 0; letterIndex < 5; letterIndex++) {

        const spanId = divId + letterIndex.toString();
        const spanElement = document.getElementById(spanId);
        spanElement.innerHTML = ' ' + enteredLines[lineIndex].letters[letterIndex].toUpperCase() + ' ';

        const evaluation = evaluations[letterIndex];
        if (evaluation === 'correct') {
          console.log('correct');
          spanElement.setAttribute("class", "correct");
        } else if (evaluation === 'present') {
          console.log('present');
          spanElement.setAttribute("class", "present");
        } else {
          console.log('absent');
          spanElement.setAttribute("class", "absent");
        }
      }
    } else {
      console.log('entered line empty');
      // divIdElement.setAttribute("class", "hiddenDiv");
    }

  }
  /*
interface EnteredLine {
  letters: string;
  evaluations: string[]; // where each string is 'present', 'absent', or '?'
}
interface EnteredLines: EnteredLine[]  // length of enteredLines is 6

return
  export interface LetterTypes {
    lettersAtExactLocation: string[];
    lettersNotAtExactLocation: string[];
    lettersNotInWord: string;
  }
*/


}
function old_processEnteredLinesMessage(enteredLines, cb) {

  console.log('processEnteredLinesMessage');
  console.log(enteredLines);

  const letterTypes = getLetterTypes(enteredLines);
  console.log('letterTypes');
  console.log(letterTypes);

  fetch(getWordsUrl, {
    method: 'POST',
    headers: {
      'Accept': 'application/json, application/xml, text/plain, text/html, *.*',
      'Content-type': 'application/json; charset=UTF-8'
    },
    body: JSON.stringify(letterTypes),
  })
    .then(response => response.text())
    .then(response => {
      const candidateWords = JSON.parse(response).words;
      cb(candidateWords);
    })
}


function getVersion(versionUrl) {
  fetch(versionUrl)
    .then(response => response.text())
    .then(response => console.log(response));
}

function getTestData(testDataUrl) {
  console.log('testDataUrl');
  fetch(testDataUrl)
    .then(
      function (response) {
        if (response.status !== 200) {
          console.log('Looks like there was a problem. Status Code: ' +
            response.status);
          return;
        }

        // Examine the text in the response
        response.json().then(function (data) {
          console.log(data);
          // data.enteredLines is the array of enteredLines

          // processEnteredLinesMessage(data.enteredLines);
        });
      }
    )
    .catch(function (err) {
      console.log('Fetch Error :-S', err);
    });
}

/*
interface EnteredLine {
  letters: string;
  evaluations: string[]; // where each string is 'present', 'absent', or '?'
}
interface EnteredLines: EnteredLine[]  // length of enteredLines is 6

return
  export interface LetterTypes {
    lettersAtExactLocation: string[];
    lettersNotAtExactLocation: string[];
    lettersNotInWord: string;
  }
*/
function getLetterTypes(enteredLines) {

  let lettersNotInWord = '';
  const letterAnswerValues = [];
  const lettersAtExactLocation = ['', '', '', '', ''];
  const lettersNotAtExactLocation = ['', '', '', '', ''];

  const numColumns = 5;

  for (let rowIndex = 0; rowIndex < enteredLines.length; rowIndex++) {
    letterAnswerValues.push([]);
    const letterAnswersInRow = letterAnswerValues[rowIndex];

    const enteredLine = enteredLines[rowIndex];

    for (let columnIndex = 0; columnIndex < numColumns; columnIndex++) {

      const evaluation = enteredLine.evaluations[columnIndex];

      let letterAnswerType;
      if (evaluation === 'present') {
        letterAnswerType = 'InWordAtNonLocation';
      } else if (evaluation === 'absent') {
        letterAnswerType = 'NotInWord';
      } else if (evaluation === 'correct') {
        letterAnswerType = 'InWordAtExactLocation';
      } else {
        letterAnswerType = 'NotInWord';
      }

      // console.log(rowIndex, columnIndex, letterAnswerType);

      letterAnswersInRow.push(letterAnswerType);

      const currentCharacter = enteredLine.letters.charAt(columnIndex);

      // console.log(rowIndex, columnIndex, currentCharacter, letterAnswerType);

      switch (letterAnswerType) {
        case 'InWordAtExactLocation':
          lettersAtExactLocation[columnIndex] = currentCharacter;
          break;
        case 'InWordAtNonLocation':
          lettersNotAtExactLocation[columnIndex] = lettersNotAtExactLocation[columnIndex] + currentCharacter;
          break;
        case 'NotInWord':
        default:
          lettersNotInWord = lettersNotInWord + currentCharacter;
          break;
      }
    }
  }

  return {
    lettersAtExactLocation,
    lettersNotAtExactLocation,
    lettersNotInWord,
  };

}

// CONTENT SCRIPT
function executeContentScript() {

  function processEnteredLines() {

    console.log('processEnteredLines invoked');

    const enteredLines = [];

    // console.log('get body');
    // const body = document.querySelectorAll('body');
    // console.log(body);

    // const wordleAppGame = document.querySelectorAll('div#wordle-app-game');



    console.log('attempt to find gameRows');
    // updated implementation - 6/24/2022
    const gameRows = document.querySelectorAll('.Row-module_row__dEHfN');
    //     const gameRow = document.querySelectorAll('.Row-module_row__dEHfN')[0].querySelectorAll(".Tile-module_tile__3ayIZ")
    //     gameRow[0].getAttribute("data-state") // 'absent', 'correct', 'present'
    //     gameRow[0].innerHtml
    console.log('rows length: ' + gameRows.length);
    gameRows.forEach((gameRow, rowIndex) => {
      // const gameRow = document.querySelectorAll('.Row-module_row__dEHfN')[rowIndex].querySelectorAll(".Tile-module_tile__3ayIZ")
      let letters = '';
      const evaluations = [];
      gameRow.childNodes.forEach((gameRowChildNode, letterIndex) => {
        const realGameRow = gameRowChildNode.childNodes[0];
        const letterText = realGameRow.innerHTML;
        const evaluation = realGameRow.getAttribute('data-state');
        letters += letterText;
        evaluations.push(evaluation);
        // console.log('rowIndex: ', rowIndex, ' letterIndex: ', letterIndex, ' evaluation: ', evaluation, ' letterText: ', letterText);
      });
      console.log('rowIndex: ', rowIndex, 'Guess: ', letters, 'Evaluations: ', evaluations);
      const enteredLine = {
        letters,
        evaluations
      };
      enteredLines.push(enteredLine);
    });





    // original implementation
    // const gameRows = document.querySelectorAll('game-app')[0].shadowRoot.querySelectorAll('#game')[0].querySelectorAll('game-row');
    // console.log('rows length: ' + gameRows.length);
    // gameRows.forEach((gameRow, rowIndex) => {

    //   const letters = gameRow.getAttribute('letters');

    //   const enteredLine = {
    //     letters,
    //     evaluations: []
    //   };

    //   const gameTiles = gameRow.shadowRoot.querySelectorAll('game-tile');

    //   gameTiles.forEach((gameTile) => {
    //     const evaluation = gameTile.getAttribute('evaluation')
    //     enteredLine.evaluations.push(evaluation);
    //   });

    //   enteredLines.push(enteredLine);

    // });

    console.log('Entered lines');
    console.log(enteredLines);

    const enteredLinesMessage = { enteredLines };
    console.log('send: ', enteredLinesMessage);
    chrome.runtime.sendMessage(enteredLinesMessage);

  }

  document.body.addEventListener('keydown', async (event) => {

    console.log('content script keydown handler invoked');

    console.log(event);

    // TEDTODO - don't fail if not on Wordle page
    if (event.key === 'Enter') {
      setTimeout(() => {
        processEnteredLines();
      }, 2000);
    }
  });
}


