const mainMenuElement = document.getElementById("main-menu");
const languageSelect = document.getElementById("language");
const menuItemNewGameElement = document.getElementById("menu-item-new-game");
const menuItemReviewElement = document.getElementById("menu-item-review");
const menuItemSettingsElement = document.getElementById("menu-item-settings");
const menuItemHowToPlayElement = document.getElementById("menu-item-how-to-play");
const menuItemAboutElement = document.getElementById("menu-item-about");

const newGameElement = document.getElementById("new-game");
const newGameHideElement = document.getElementById("new-game-hide");
const scoreElement = document.getElementById("score");
const gameQuestionNumberElement = document.getElementById("game-question-number");
const gameQuestionElement = document.getElementById("game-question");
const gameScriptureRefsElement = document.getElementById("game-scripture-refs");
const submitButton = document.getElementById("submit");
const nextGameQuestionButton = document.getElementById("next-game-question");
const restartButton = document.getElementById("restart");

const gameScriptureDialog = document.getElementById("game-scripture-dialog");
const gameScriptureDialogHideElement = document.getElementById("game-scripture-dialog-hide");

const gameResponseDialog = document.getElementById("game-response-dialog");
const gameResponseDialogHideElement = document.getElementById("game-response-dialog-hide");

const reviewElement = document.getElementById("review");
const reviewHideElement = document.getElementById("review-hide");
const reviewQuestionSelect = document.getElementById("review-question");
const reviewQuestionTextElement = document.getElementById("review-question-text");
const reviewScriptureRefsElement = document.getElementById("review-scripture-refs");
const previousReviewQuestionButton = document.getElementById("previous-review-question");
const nextReviewQuestionButton = document.getElementById("next-review-question");

const reviewScriptureDialog = document.getElementById("review-scripture-dialog");
const reviewScriptureDialogHideElement = document.getElementById("review-scripture-dialog-hide");

const settingsElement = document.getElementById("settings");
const settingsHideElement = document.getElementById("settings-hide");
const availableQuestionsElement = document.getElementById("available-questions");
const numQuestionsPerGameSelect = document.getElementById("num-questions-per-game");
const applyCurrentSettingsButton = document.getElementById("apply-current-settings");
const saveCurrentSettingsButton = document.getElementById("save-current-settings");
const deleteSavedSettingsButton = document.getElementById("delete-saved-settings");
const resetToDefaultSettingsButton = document.getElementById("reset-to-default-settings");

const howToPlayElement = document.getElementById("how-to-play");
const howToPlayHideElement = document.getElementById("how-to-play-hide");

const aboutElement = document.getElementById("about");
const aboutHideElement = document.getElementById("about-hide");

let settings = null;
let editableSettings = null;
let reviewQuestions = [];
let currentReviewQuestionIndex = 0;
let gameQuestions = []; // Questions selected for the current game
let score = 0;
let currentGameQuestionIndex = 0;
let selectedGameScriptureRefs = [];
let selectedGameScriptureRefsSubmitted = false;
let gameScriptureDialogDisplayedBeforeSubmission = false;

function applyEditableSettings() {
  settings = JSON.parse(JSON.stringify(editableSettings));
}

function displayDialog(source, dialog, title, content) {
  source.classList.add("disabled");
  if (title !== null) {
    dialog.children[0].children[0].textContent = title;
  }
  if (content !== null) {
    dialog.children[1].innerHTML = content;
  }
  dialog.classList.remove("display-none");
  dialog.classList.remove("disabled");
  dialog.classList.add("dialog");
}

function displayElement(source, element) {
  source.classList.remove("element");
  source.classList.add("display-none");
  source.classList.add("disabled");

  element.classList.add("element");
  element.classList.remove("display-none");
  element.classList.remove("disabled");
}

function displayGameScriptureDialog(source, gameScriptureDialog, scripture) {
  displayDialog(source, gameScriptureDialog, scripture.ref, scripture.html);
  if (!selectedGameScriptureRefsSubmitted) {
    gameScriptureDialogDisplayedBeforeSubmission = true;
  }
}

function displayNewGameElement(source, newGameElement) {
  newGame();
  displayElement(source, newGameElement);
}

function displayReviewElement(source, reviewElement) {
  review();
  displayElement(source, reviewElement);
}

function deleteSavedSettings() {
  localStorage.removeItem(settingsLocalStorageItemKey);
}

function getAvailableQuestions() {
  return allQuestions.filter(q => settings.availableQuestions.includes(q.question));
}

function getGameQuestions() {
  const availableQuestions = JSON.parse(JSON.stringify(getAvailableQuestions()));
  shuffleArray(availableQuestions);
  const questions = availableQuestions.slice(0, settings.numQuestionsPerGame);
  questions.forEach((question) => {
    shuffleArray(question.scriptures);
  });
  return questions;
}

function getReviewQuestions() {
  return JSON.parse(JSON.stringify(getAvailableQuestions()));
}

function getSettings() {
  const item = localStorage.getItem(settingsLocalStorageItemKey);
  if (item !== null) {
    return JSON.parse(item);
  }
  return JSON.parse(JSON.stringify(defaultSettings));
}

function hideDialog(source, dialog) {
  source.classList.remove("disabled");
  dialog.classList.remove("dialog");
  dialog.classList.add("display-none");
  dialog.classList.add("disabled");
}

function interpolate(str, args) {
  let result = "";
  for (let i = 0; i < str.length;) {
    if (str[i] === "$" && str[i + 1] === "{") {
      // Try to parse a placeholder
      let j = i + 2;
      let numStr = "";
      while (j < str.length && str[j] >= "0" && str[j] <= "9") {
        numStr += str[j];
        j++;
      }
      if (numStr.length > 0 && str[j] === "}") {
        // Found a valid placeholder
        const argIdx = parseInt(numStr, 10);
        result += argIdx < args.length ? args[argIdx] : "";
        i = j + 1;
        continue;
      }
      // Not a valid placeholder, treat as literal
      result += str[i];
      i++;
    } else if (str[i] === "$" && str[i + 1] === "$" && str[i + 2] === "{") {
      // Escaped literal ${
      result += "${";
      i += 3;
    } else {
      result += str[i];
      i++;
    }
  }
  return result;
}

function loadGameQuestion() {
  const currentGameQuestion = gameQuestions[currentGameQuestionIndex];
  gameQuestionNumberElement.textContent = interpolate(gameQuestionNumberText, [
    (currentGameQuestionIndex + 1).toString(),
    gameQuestions.length.toString()
  ]);
  gameQuestionElement.textContent = currentGameQuestion.question;

  removeChildrenFromElement(gameScriptureRefsElement);
  currentGameQuestion.scriptures.forEach((scripture) => {
    const gameScriptureContainerElementElement = document.createElement("div");
    gameScriptureContainerElementElement.classList.add("game-scripture-ref-container");

    const gameScriptureRefCheckbox = document.createElement("input");
    gameScriptureRefCheckbox.classList.add("game-scripture-ref-checkbox");
    gameScriptureRefCheckbox.type = "checkbox";
    gameScriptureRefCheckbox.value = scripture.ref;
    gameScriptureRefCheckbox.checked = false;
    gameScriptureRefCheckbox.addEventListener("click", () =>
      toggleGameScriptureRefCheckbox(gameScriptureRefCheckbox)
    );

    const gameScriptureRefElement = document.createElement("div");
    gameScriptureRefElement.classList.add("game-scripture-ref");

    const aElement = document.createElement("a");
    aElement.href = "#";
    aElement.textContent = scripture.ref;
    aElement.addEventListener("click", () =>
      displayGameScriptureDialog(newGameElement, gameScriptureDialog, scripture)
    );
    gameScriptureRefElement.appendChild(aElement);

    gameScriptureContainerElementElement.appendChild(gameScriptureRefCheckbox);
    gameScriptureContainerElementElement.appendChild(gameScriptureRefElement);

    gameScriptureRefsElement.appendChild(gameScriptureContainerElementElement);
  });

  selectedGameScriptureRefsSubmitted = false;
  submitButton.disabled = false;
  nextGameQuestionButton.disabled = true;
}

function loadReviewQuestion() {
  const currentReviewQuestion = reviewQuestions[currentReviewQuestionIndex];

  removeChildrenFromElement(reviewQuestionSelect);
  for (let i = 0; i < reviewQuestions.length; i++) {
    const option = document.createElement("option");
    const value = i.toString();
    const optionText = document.createTextNode(reviewQuestions[i].question);
    option.appendChild(optionText);
    option.setAttribute("value", value);
    reviewQuestionSelect.appendChild(option);
  }
  reviewQuestionSelect.value = currentReviewQuestionIndex;

  reviewQuestionTextElement.textContent = currentReviewQuestion.question;

  removeChildrenFromElement(reviewScriptureRefsElement);
  currentReviewQuestion.scriptures.forEach((scripture) => {
    if (currentReviewQuestion.correctScriptureRefs.includes(scripture.ref)) {
      const reviewScriptureRefElement = document.createElement("div");
      reviewScriptureRefElement.classList.add("review-scripture-ref");
      reviewScriptureRefElement.classList.add("correct");

      const aElement = document.createElement("a");
      aElement.classList.add("correct");
      aElement.href = "#";
      aElement.textContent = scripture.ref;
      aElement.addEventListener("click", () =>
        displayDialog(reviewElement, reviewScriptureDialog, scripture.ref, scripture.html)
      );
      reviewScriptureRefElement.appendChild(aElement);

      reviewScriptureRefsElement.appendChild(reviewScriptureRefElement);
    }
  });

  previousReviewQuestionButton.disabled = currentReviewQuestionIndex === 0;
  nextReviewQuestionButton.disabled = currentReviewQuestionIndex === reviewQuestions.length - 1;
}

function newGame() {
  gameQuestions = getGameQuestions(); // Select new questions
  score = 0;
  currentGameQuestionIndex = 0;
  selectedGameScriptureRefs = [];
  selectedGameScriptureRefsSubmitted = false;
  gameScriptureDialogDisplayedBeforeSubmission = false;
  updateScoreElement();
  loadGameQuestion();
}

function nextGameQuestion() {
  currentGameQuestionIndex++;
  selectedGameScriptureRefs = [];
  loadGameQuestion();
}

function nextReviewQuestion() {
  currentReviewQuestionIndex++;
  loadReviewQuestion();
}

function previousReviewQuestion() {
  currentReviewQuestionIndex--;
  loadReviewQuestion();
}

function review() {
  reviewQuestions = getReviewQuestions();
  currentReviewQuestionIndex = 0;
  loadReviewQuestion();
}

function removeChildrenFromElement(element) {
  while (element.firstChild) {
    removeChildrenFromElement(element.lastChild);
    element.removeChild(element.lastChild);
  }
}

function resetToDefaultSettings() {
  editableSettings = JSON.parse(JSON.stringify(defaultSettings));
  updateSettingsElement();
}

function saveEditableSettings() {
  localStorage.setItem(settingsLocalStorageItemKey, JSON.stringify(editableSettings));
}

function selectLanguage(languageSelect) {
  location.replace(languageSelect.value);
}

function selectNumQuestionsPerGame(numQuestionsPerGameSelect) {
  editableSettings.numQuestionsPerGame = parseInt(numQuestionsPerGameSelect.value);
  updateSettingsElement();
}

function selectReviewQuestion(reviewQuestionSelect) {
  currentReviewQuestionIndex = parseInt(reviewQuestionSelect.value);
  loadReviewQuestion();
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function submitSelectedGameScriptureRefs() {
  selectedGameScriptureRefsSubmitted = true;
  submitButton.disabled = true;

  const currentGameQuestion = gameQuestions[currentGameQuestionIndex];
  let correctCount = 0;

  const gameScriptureRefContainerElements = document.querySelectorAll(".game-scripture-ref-container");
  gameScriptureRefContainerElements.forEach((gameScriptureRefContainerElement) => {
    const gameScriptureRefCheckbox = gameScriptureRefContainerElement.children[0];
    const gameScriptureRefElement = gameScriptureRefContainerElement.children[1];
    const gameScriptureRefLink = gameScriptureRefElement.children[0];
    const gameScriptureRef = gameScriptureRefCheckbox.value;
    const isCorrect = currentGameQuestion.correctScriptureRefs.includes(gameScriptureRef);
    const isSelected = selectedGameScriptureRefs.includes(gameScriptureRef);

    if (isCorrect) {
      gameScriptureRefContainerElement.classList.add("correct");
      gameScriptureRefCheckbox.classList.add("correct");
      gameScriptureRefElement.classList.add("correct");
      gameScriptureRefLink.classList.add("correct");
      if (isSelected) {
        correctCount++;
      }
    }

    // Disable all scripture refs checkboxes after submission
    gameScriptureRefCheckbox.classList.add("disabled");
  });

  let gameResponse = "";

  if (correctCount !== currentGameQuestion.correctScriptureRefs.length) {
    gameResponse = interpolate(gameResponse01aHtml, [
      correctCount.toString(),
      currentGameQuestion.correctScriptureRefs.length.toString()
    ]);
  } else if (correctCount === currentGameQuestion.correctScriptureRefs.length && selectedGameScriptureRefs.length !== currentGameQuestion.correctScriptureRefs.length) {
    gameResponse = interpolate(gameResponse01bHtml, [
      correctCount.toString(),
      currentGameQuestion.correctScriptureRefs.length.toString(),
      (selectedGameScriptureRefs.length - currentGameQuestion.correctScriptureRefs.length).toString()
    ]);
  } else if (correctCount === currentGameQuestion.correctScriptureRefs.length && selectedGameScriptureRefs.length === currentGameQuestion.correctScriptureRefs.length) {
    score++;
    gameResponse = gameResponse01cHtml;
  }

  updateScoreElement();

  // Game Over Message
  if (currentGameQuestionIndex === gameQuestions.length - 1) {
    gameResponse += interpolate(gameResponse02Html, [score.toString()]);

    const scorePercentage = parseFloat(((score / gameQuestions.length) * 100).toFixed(0));

    if (score === 0) {
      gameResponse += interpolate(gameResponse03aHtml, [
        score.toString(),
        gameQuestions.length.toString()
      ]);
    } else if (score === 1 && gameQuestions.length > 2) {
      gameResponse += interpolate(gameResponse03bHtml, [
        score.toString(),
        gameQuestions.length.toString()
      ]);
    } else if (scorePercentage < 50) {
      gameResponse += interpolate(gameResponse03cHtml, [
        score.toString(),
        gameQuestions.length.toString()
      ]);
    } else if (scorePercentage === 50) {
      gameResponse += interpolate(gameResponse03dHtml, [
        score.toString(),
        gameQuestions.length.toString()
      ]);
    } else if (scorePercentage > 50 && scorePercentage < 100) {
      gameResponse += interpolate(gameResponse03eHtml, [
        score.toString(),
        gameQuestions.length.toString()
      ]);
    } else if (score === gameQuestions.length) {
      gameResponse += gameResponse03fHtml;
      if (gameScriptureDialogDisplayedBeforeSubmission) {
        gameResponse += gameResponse03f01Html;
      } else if (gameQuestions.length < allQuestions.length) {
        gameResponse += gameResponse03f02Html;
      } else if (gameQuestions.length === allQuestions.length) {
        /*
         * TODO: Something special should happen here.
         */
      }
    }

    nextGameQuestionButton.disabled = true; // Disable next button on last question
  } else {
    nextGameQuestionButton.disabled = false; // Enable the next button
  }

  displayDialog(newGameElement, gameResponseDialog, null, gameResponse);
}

function toggleAvailableQuestionCheckbox(availableQuestionCheckbox) {
  const availableQuestion = availableQuestionCheckbox.value;
  if (editableSettings.availableQuestions.includes(availableQuestion)) {
    editableSettings.availableQuestions = editableSettings.availableQuestions.filter(q => q !== availableQuestion);
  } else {
    editableSettings.availableQuestions.push(availableQuestion);
  }
  editableSettings.numQuestionsPerGame = editableSettings.availableQuestions.length;
  updateSettingsElement();
}

function toggleGameScriptureRefCheckbox(gameScriptureRefCheckbox) {
  const gameScriptureRef = gameScriptureRefCheckbox.value;
  if (selectedGameScriptureRefs.includes(gameScriptureRef)) {
    selectedGameScriptureRefs = selectedGameScriptureRefs.filter(s => s !== gameScriptureRef);
  } else {
    selectedGameScriptureRefs.push(gameScriptureRef);
  }
}

function updateScoreElement() {
  scoreElement.textContent = interpolate(scoreText, [score.toString()]);
}

function updateSettingsElement() {
  const availableQuestionCheckboxes = document.querySelectorAll(".available-question-checkbox");
  availableQuestionCheckboxes.forEach((availableQuestionCheckbox) => {
    availableQuestionCheckbox.checked = editableSettings.availableQuestions.includes(availableQuestionCheckbox.value);
    if (availableQuestionCheckbox.checked && editableSettings.availableQuestions.length === 1) {
      availableQuestionCheckbox.classList.add("disabled");
    } else {
      availableQuestionCheckbox.classList.remove("disabled");
    }
  });
  for (let i = numQuestionsPerGameSelect.options.length - 1; i >= editableSettings.availableQuestions.length; i--) {
    const option = numQuestionsPerGameSelect.options[i];
    option.removeChild(option.lastChild);
    numQuestionsPerGameSelect.removeChild(option);
  }
  for (let i = 0; i < editableSettings.availableQuestions.length; i++) {
    let option = null;
    if (numQuestionsPerGameSelect.options[i]) {
      option = numQuestionsPerGameSelect.options[i];
    } else {
      option = document.createElement("option");
      const value = (i + 1).toString();
      const optionText = document.createTextNode(value);
      option.appendChild(optionText);
      option.setAttribute("value", value);
      numQuestionsPerGameSelect.appendChild(option);
    }
  }
  numQuestionsPerGameSelect.value = editableSettings.numQuestionsPerGame.toString();
}

languageSelect.addEventListener("change", () => selectLanguage(languageSelect));

menuItemNewGameElement.children[0].addEventListener("click", () =>
  displayNewGameElement(mainMenuElement, newGameElement)
);
menuItemReviewElement.children[0].addEventListener("click", () =>
  displayReviewElement(mainMenuElement, reviewElement)
);
menuItemSettingsElement.children[0].addEventListener("click", () =>
  displayElement(mainMenuElement, settingsElement)
);
menuItemHowToPlayElement.children[0].addEventListener("click", () =>
  displayElement(mainMenuElement, howToPlayElement)
);
menuItemAboutElement.children[0].addEventListener("click", () =>
  displayElement(mainMenuElement, aboutElement)
);

newGameHideElement.children[0].addEventListener("click", () =>
  displayElement(newGameElement, mainMenuElement)
);

submitButton.addEventListener("click", () => submitSelectedGameScriptureRefs());
nextGameQuestionButton.addEventListener("click", () => nextGameQuestion());
restartButton.addEventListener("click", () => newGame());

gameScriptureDialogHideElement.addEventListener("click", () => hideDialog(newGameElement, gameScriptureDialog));

gameResponseDialogHideElement.addEventListener("click", () => hideDialog(newGameElement, gameResponseDialog));

reviewHideElement.children[0].addEventListener("click", () =>
  displayElement(reviewElement, mainMenuElement)
);

reviewQuestionSelect.addEventListener("change", () => selectReviewQuestion(reviewQuestionSelect));

previousReviewQuestionButton.addEventListener("click", () => previousReviewQuestion());

nextReviewQuestionButton.addEventListener("click", () => nextReviewQuestion());

reviewScriptureDialogHideElement.addEventListener("click", () => hideDialog(reviewElement, reviewScriptureDialog));

settingsHideElement.children[0].addEventListener("click", () =>
  displayElement(settingsElement, mainMenuElement)
);

allQuestions.forEach((question) => {
  const availableQuestionCheckbox = document.createElement("input");
  availableQuestionCheckbox.classList.add("available-question-checkbox");
  availableQuestionCheckbox.type = "checkbox";
  availableQuestionCheckbox.value = question.question;
  availableQuestionCheckbox.addEventListener("click", () =>
    toggleAvailableQuestionCheckbox(availableQuestionCheckbox)
  );

  const availableQuestionElement = document.createElement("div");
  availableQuestionElement.classList.add("available-question");
  availableQuestionElement.textContent = question.question;

  const availableQuestionContainer = document.createElement("div");
  availableQuestionContainer.classList.add("available-question-container");
  availableQuestionContainer.appendChild(availableQuestionCheckbox);
  availableQuestionContainer.appendChild(availableQuestionElement);

  availableQuestionsElement.appendChild(availableQuestionContainer);
});

numQuestionsPerGameSelect.addEventListener("change", () => 
  selectNumQuestionsPerGame(numQuestionsPerGameSelect)
);

applyCurrentSettingsButton.addEventListener("click", () => applyEditableSettings());

saveCurrentSettingsButton.addEventListener("click", () => saveEditableSettings());

deleteSavedSettingsButton.addEventListener("click", () => deleteSavedSettings());

resetToDefaultSettingsButton.addEventListener("click", () => resetToDefaultSettings());

howToPlayHideElement.children[0].addEventListener("click", () =>
  displayElement(howToPlayElement, mainMenuElement)
);

aboutHideElement.children[0].addEventListener("click", () =>
  displayElement(aboutElement, mainMenuElement)
);

settings = getSettings();
editableSettings = JSON.parse(JSON.stringify(settings));
updateSettingsElement();