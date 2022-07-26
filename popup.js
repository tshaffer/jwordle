const serverUrl = 'http://localhost:8000';
const versionUrl = serverUrl + '/api/v1/version';
const getWordsUrl = serverUrl + '/api/v1/getWordsEndpoint';
const testDataUrl = 'testData.json';
const runtimeTestDataUrl = chrome.runtime.getURL(testDataUrl);

/*
  INTERFACES

    export interface LetterTypes {
      lettersAtExactLocation: string[];
      lettersNotAtExactLocation: string[];
      lettersNotInWord: string;
    }

    interface EnteredLine {
      letters: string;
      evaluations: string[]; // where each string is 'present', 'absent', or '?'
    }

    interface EnteredLines: EnteredLine[]
*/

getVersion(versionUrl);
// getTestData(runtimeTestDataUrl);

function getGuessValue(id) {
  const element = document.getElementById(id);

  return {
    letter: element.innerHTML.trim(),
    evaluation: element.className,
  }
}

function getEnteredLine(lineId) {
  const guessValue0 = getGuessValue(lineId + '0');
  const guessValue1 = getGuessValue(lineId + '1');
  const guessValue2 = getGuessValue(lineId + '2');
  const guessValue3 = getGuessValue(lineId + '3');
  const guessValue4 = getGuessValue(lineId + '4');
  const letters = guessValue0.letter + guessValue1.letter + guessValue2.letter + guessValue3.letter + guessValue4.letter;
  const evaluations = [guessValue0.evaluation, guessValue1.evaluation, guessValue2.evaluation, guessValue3.evaluation, guessValue4.evaluation];
  return {
    letters,
    evaluations,
  }
}

function lineElementClickCallback(enteredLineIds, candidateWordsListId) {

  // get the first string
  const enteredLines = [getEnteredLine('l0')];

  // get subsequent strings
  enteredLineIds.forEach((enteredLineId) => {
    enteredLines.push(getEnteredLine(enteredLineId));
  });

  const letterTypes = getLetterTypes(enteredLines);

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
      twordleCallback(candidateWords, candidateWordsListId);
    })

}
chrome.tabs.query({ active: true, currentWindow: true })
  .then(([tab]) => {

    const line1Element = document.getElementById('l1');
    line1Element.onclick = () => {
      lineElementClickCallback(['l1'], 'l1CandidateWordsList');
    }

    const line2Element = document.getElementById('l2');
    line2Element.onclick = () => {
      lineElementClickCallback(['l1', 'l2'], 'l2CandidateWordsList');
    }

    const line3Element = document.getElementById('l3');
    line3Element.onclick = () => {
      lineElementClickCallback(['l1', 'l2', 'l3'], 'l3CandidateWordsList');
    }

    const line4Element = document.getElementById('l4');
    line4Element.onclick = () => {
      lineElementClickCallback(['l1', 'l2', 'l3', 'l4'], 'l4CandidateWordsList');
    }

    const line5Element = document.getElementById('l5');
    line5Element.onclick = () => {
      lineElementClickCallback(['l1', 'l2', 'l3', 'l4', 'l5'], 'l5CandidateWordsList');
    }

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: executeContentScript,
    });

    chrome.runtime.onMessage.addListener(
      function (request) {
        processEnteredLinesMessage(request.enteredLines);
      }
    );

  });


function twordleCallback(candidateWords, candidateWordsListId) {
  console.log(candidateWords);
  const candidateWordsList = document.getElementById(candidateWordsListId);

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

    const divIdElement = document.getElementById(divId);

    if (enteredLine.length > 0) {
      divIdElement.setAttribute("class", "blockDiv");
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
      divIdElement.setAttribute("class", "hiddenDiv");
    }

  }
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



    console.log('attempt to find gameRows');
    // updated implementation - 6/24/2022
    const gameRows = document.querySelectorAll('.Row-module_row__dEHfN');
    console.log('rows length: ' + gameRows.length);
    gameRows.forEach((gameRow, rowIndex) => {
      let letters = '';
      const evaluations = [];
      gameRow.childNodes.forEach((gameRowChildNode, letterIndex) => {
        const realGameRow = gameRowChildNode.childNodes[0];
        const letterText = realGameRow.innerHTML;
        const evaluation = realGameRow.getAttribute('data-state');
        letters += letterText;
        evaluations.push(evaluation);
      });
      console.log('rowIndex: ', rowIndex, 'Guess: ', letters, 'Evaluations: ', evaluations);
      const enteredLine = {
        letters,
        evaluations
      };
      enteredLines.push(enteredLine);
    });

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


