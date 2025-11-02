$("document").ready(function () {
  var currentQuestion = 0;
  var totalQuestions = 0;
  var userAnswers = {};
  var all_questions;
  var all_questions_en;
  var all_evidences;
  var all_evidences_en;
  var faq;
  var faq_en;

  function hideFormBtns() {
    $("#nextQuestion").hide();
    $("#backButton").hide();
  }

  // Load all questions (GR + EN)
  function getQuestions() {
    return fetch("question-utils/all-questions.json")
      .then((response) => response.json())
      .then((data) => {
        all_questions = data;
        totalQuestions = data.length;
        return fetch("question-utils/all-questions-en.json")
          .then((response) => response.json())
          .then((dataEn) => {
            all_questions_en = dataEn;
          });
      })
      .catch((error) => console.error("Error loading questions:", error));
  }

  // Load evidence (required docs)
  function getEvidences() {
    return fetch("question-utils/cpsv.json")
      .then((response) => response.json())
      .then((data) => {
        all_evidences = data;
        return fetch("question-utils/cpsv-en.json")
          .then((response) => response.json())
          .then((dataEn) => {
            all_evidences_en = dataEn;
          });
      })
      .catch((error) => console.error("Error loading evidences:", error));
  }

  // Load FAQs
  function getFaq() {
    return fetch("question-utils/faq.json")
      .then((response) => response.json())
      .then((data) => {
        faq = data;
        return fetch("question-utils/faq-en.json")
          .then((response) => response.json())
          .then((dataEn) => {
            faq_en = dataEn;
          });
      })
      .catch((error) => console.error("Error loading FAQs:", error));
  }

  // Display evidence (required documents)
  function getEvidencesById(id) {
    var selectedEvidence =
      currentLanguage === "greek" ? all_evidences : all_evidences_en;
    selectedEvidence = selectedEvidence.PublicService.evidence.find(
      (e) => e.id === id
    );

    if (selectedEvidence) {
      const evidenceListElement = document.getElementById("evidences");
      selectedEvidence.evs.forEach((ev) => {
        const listItem = document.createElement("li");
        listItem.textContent = ev.name;
        evidenceListElement.appendChild(listItem);
      });
    }
  }

  function setResult(text) {
    const resultWrapper = document.getElementById("resultWrapper");
    const result = document.createElement("h5");
    result.textContent = text;
    resultWrapper.appendChild(result);
  }

  // Load FAQs dynamically
  function loadFaqs() {
    var faqData = currentLanguage === "greek" ? faq : faq_en;
    var faqTitle =
      currentLanguage === "greek"
        ? "Συχνές Ερωτήσεις"
        : "Frequently Asked Questions";

    var faqElement = document.createElement("div");
    faqElement.innerHTML = `
      <div class="govgr-heading-m" data-component="faq">
        ${faqTitle}
      </div>
    `;

    faqData.forEach((faqItem) => {
      var faqSection = document.createElement("details");
      faqSection.className = "govgr-accordion__section";
      faqSection.innerHTML = `
        <summary class="govgr-accordion__section-summary">
          <h2 class="govgr-accordion__section-heading">
            <span class="govgr-accordion__section-button">
              ${faqItem.question}
            </span>
          </h2>
        </summary>
        <div class="govgr-accordion__section-content">
          <p class="govgr-body">${faqItem.answer}</p>
        </div>
      `;
      faqElement.appendChild(faqSection);
    });

    $(".faqContainer").html(faqElement);
  }

  // Load each question dynamically
  function loadQuestion(questionId, noError) {
    $("#nextQuestion").show();
    if (currentQuestion > 0) $("#backButton").show();

    var question =
      currentLanguage === "greek"
        ? all_questions[questionId]
        : all_questions_en[questionId];

    var questionElement = document.createElement("div");
    questionElement.innerHTML = `
      <div class='govgr-field'>
        <fieldset class='govgr-fieldset'>
          <legend class='govgr-fieldset__legend govgr-heading-l'>
            ${question.question}
          </legend>
          <div class='govgr-radios'>
            ${question.options
              .map(
                (option) => `
              <div class='govgr-radios__item'>
                <label class='govgr-label govgr-radios__label'>
                  <input class='govgr-radios__input' type='radio' name='question-option' value='${option}' />
                  ${option}
                </label>
              </div>`
              )
              .join("")}
          </div>
        </fieldset>
      </div>
    `;

    $(".question-container").html(questionElement);
  }

  // When conditions not met
  function skipToEnd(message) {
    const errorEnd = document.createElement("h5");
    const error =
      currentLanguage === "greek"
        ? "Λυπούμαστε, αλλά δεν μπορείτε να προχωρήσετε στην εγγραφή."
        : "We are sorry, but you are not eligible for school enrollment.";
    errorEnd.className = "govgr-error-summary";
    errorEnd.textContent = error + " " + message;
    $(".question-container").html(errorEnd);
    hideFormBtns();
  }

  // Start button
  $("#startBtn").click(function () {
    $("#intro").html("");
    $("#languageBtn").hide();
    $("#questions-btns").show();
  });

  // Retrieve answers and show results
  function retrieveAnswers() {
    var allAnswers = [];
    for (var i = 0; i < totalQuestions; i++) {
      var answer = sessionStorage.getItem("answer_" + i);
      allAnswers.push(answer);
    }

    // Example outcomes
    if (allAnswers[1] === "2") {
      skipToEnd(
        currentLanguage === "greek"
          ? "Το παιδί πρέπει να έχει συμπληρώσει το 6ο έτος της ηλικίας του."
          : "The child must be at least 6 years old by December 31."
      );
      return;
    }

    if (allAnswers[3] === "2") {
      skipToEnd(
        currentLanguage === "greek"
          ? "Πρέπει να προσκομίσετε όλα τα απαραίτητα δικαιολογητικά για την εγγραφή."
          : "You must provide all required documents to complete enrollment."
      );
      return;
    }

    // If passed all checks → eligible
    currentLanguage === "greek"
      ? setResult("Μπορείτε να προχωρήσετε με την εγγραφή του παιδιού σας.")
      : setResult("You can proceed with your child’s school enrollment.");
  }

  // Final results
  function submitForm() {
    const resultWrapper = document.createElement("div");
    const titleText =
      currentLanguage === "greek"
        ? "Είστε δικαιούχος εγγραφής!"
        : "You are eligible for enrollment!";
    resultWrapper.innerHTML = `<h1 class='answer'>${titleText}</h1>`;
    resultWrapper.setAttribute("id", "resultWrapper");
    $(".question-container").html(resultWrapper);

    const evidenceListElement = document.createElement("ol");
    evidenceListElement.setAttribute("id", "evidences");
    $(".question-container").append(
      currentLanguage === "greek"
        ? "<br /><h5 class='answer'>Τα απαραίτητα δικαιολογητικά για την εγγραφή είναι:</h5>"
        : "<br /><h5 class='answer'>The required documents for enrollment are:</h5>"
    );
    $(".question-container").append(evidenceListElement);

    getEvidencesById(1);
    retrieveAnswers();
    hideFormBtns();
  }

  // Navigation buttons
  $("#nextQuestion").click(function () {
    if ($(".govgr-radios__input").is(":checked")) {
      var selectedRadioButtonIndex =
        $('input[name="question-option"]').index(
          $('input[name="question-option"]:checked')
        ) + 1;
      userAnswers[currentQuestion] = selectedRadioButtonIndex;
      sessionStorage.setItem(
        "answer_" + currentQuestion,
        selectedRadioButtonIndex
      );

      if (currentQuestion + 1 == totalQuestions) {
        submitForm();
      } else {
        currentQuestion++;
        loadQuestion(currentQuestion, true);
        if (currentQuestion + 1 == totalQuestions)
          $(this).text(currentLanguage === "greek" ? "Υποβολή" : "Submit");
      }
    } else {
      loadQuestion(currentQuestion, false);
    }
  });

  $("#backButton").click(function () {
    if (currentQuestion > 0) {
      currentQuestion--;
      loadQuestion(currentQuestion, true);
    }
  });

  $("#languageBtn").click(function () {
    toggleLanguage();
    loadFaqs();
    if (currentQuestion >= 0 && currentQuestion < totalQuestions)
      loadQuestion(currentQuestion, true);
  });

  $("#questions-btns").hide();

  getQuestions().then(() => {
    getEvidences().then(() => {
      getFaq().then(() => {
        loadFaqs();
        $("#faqContainer").show();
        loadQuestion(currentQuestion, true);
      });
    });
  });
});
