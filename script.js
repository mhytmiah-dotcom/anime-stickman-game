const chat = document.getElementById("chat");
const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const navItems = document.querySelectorAll(".nav-item");
const promptButtons = document.querySelectorAll(".prompt-btn");

const knowledge = {
  earth: {
    keyword: "earth",
    title: "Earth",
    response: "Earth is the third planet from the Sun and the only known planet that supports life. It has oceans, atmosphere, weather, and a rich variety of ecosystems.",
    facts: [
      { label: "Type", text: "Rocky planet" },
      { label: "Moon", text: "1 natural moon" },
      { label: "Water", text: "About 71% of Earth is covered by water" }
    ]
  },
  galaxy: {
    keyword: "galaxy",
    title: "Galaxy",
    response: "A galaxy is a huge system of stars, gas, dust, and dark matter held together by gravity. Our home galaxy is the Milky Way.",
    facts: [
      { label: "Home", text: "The Milky Way galaxy" },
      { label: "Size", text: "It contains hundreds of billions of stars" },
      { label: "Shape", text: "Spiral-shaped galaxy" }
    ]
  },
  planet: {
    keyword: "planet",
    title: "Planets",
    response: "The solar system has eight planets: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune.",
    facts: [
      { label: "Inner planets", text: "Mercury, Venus, Earth, Mars" },
      { label: "Outer planets", text: "Jupiter, Saturn, Uranus, Neptune" },
      { label: "Largest", text: "Jupiter is the biggest planet" }
    ]
  },
  space: {
    keyword: "space",
    title: "Space",
    response: "Space is the vast region beyond Earth's atmosphere, filled with stars, planets, nebulae, black holes, and empty distances between objects.",
    facts: [
      { label: "Universe", text: "Space contains the observable universe" },
      { label: "Stars", text: "Stars are giant balls of hot gas" },
      { label: "Black holes", text: "Some regions of space have extremely strong gravity" }
    ]
  },
  moon: {
    keyword: "moon",
    title: "Moon",
    response: "The Moon is Earth's natural satellite and influences tides, seasons, and the night sky.",
    facts: [
      { label: "Distance", text: "About 384,400 km from Earth" },
      { label: "Surface", text: "Covered with craters and rocky terrain" },
      { label: "Orbit", text: "It orbits Earth approximately every 27.3 days" }
    ]
  },
  mars: {
    keyword: "mars",
    title: "Mars",
    response: "Mars is the red planet, known for its iron-rich dust and giant volcanoes. Scientists study it for signs of ancient water.",
    facts: [
      { label: "Color", text: "Reddish because of iron oxide" },
      { label: "Moons", text: "Phobos and Deimos" },
      { label: "Exploration", text: "Robotic missions have explored its surface" }
    ]
  },
  saturn: {
    keyword: "saturn",
    title: "Saturn",
    response: "Saturn is famous for its bright rings made mostly of ice and rock particles.",
    facts: [
      { label: "Rings", text: "The rings are wide but very thin" },
      { label: "Moons", text: "It has many moons, including Titan" },
      { label: "Gas giant", text: "Saturn is a giant planet made mostly of gas" }
    ]
  },
  star: {
    keyword: "star",
    title: "Star",
    response: "A star is a massive glowing sphere of hot plasma powered by nuclear fusion at its core.",
    facts: [
      { label: "Sun", text: "Our Sun is a star" },
      { label: "Life cycle", text: "Stars are born, live, and die over vast timescales" },
      { label: "Light", text: "Stars produce light and heat as they burn fuel" }
    ]
  },
  default: {
    keyword: "general",
    title: "Universe fact",
    response: "The universe is incredibly vast, containing billions of galaxies, each with billions of stars. It is still being explored with telescopes, rovers, and space missions.",
    facts: [
      { label: "Scale", text: "The universe is unimaginably large" },
      { label: "Light years", text: "Distances are measured in light-years" },
      { label: "Discovery", text: "New stars and planets are still being discovered today" }
    ]
  }
};

function addMessage(text, type = "bot") {
  const message = document.createElement("div");
  message.className = `message ${type}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = type === "bot" ? "AI" : "You";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerHTML = text;

  message.appendChild(avatar);
  message.appendChild(bubble);
  chat.appendChild(message);
  chat.scrollTop = chat.scrollHeight;
}

function createAnswerCard(title, text) {
  const card = document.createElement("div");
  card.className = "answer-card";

  const heading = document.createElement("h4");
  heading.textContent = title;

  const paragraph = document.createElement("p");
  paragraph.textContent = text;

  card.appendChild(heading);
  card.appendChild(paragraph);

  return card;
}

function getTopicAnswer(prompt) {
  const lowerPrompt = prompt.toLowerCase();

  const matchedEntry = Object.entries(knowledge).find(([key, value]) => {
    if (key === "default") return false;
    return lowerPrompt.includes(value.keyword);
  });

  const selected = matchedEntry ? matchedEntry[1] : knowledge.default;

  const answerHtml = `
    <strong>${selected.title}</strong><br>
    ${selected.response}
  `;

  const cardsWrap = document.createElement("div");
  cardsWrap.className = "answer-cards";

  selected.facts.forEach((fact) => {
    const card = createAnswerCard(fact.label, fact.text);
    cardsWrap.appendChild(card);
  });

  return { answerHtml, cardsWrap };
}

function handleSubmit(event) {
  event.preventDefault();
  const prompt = input.value.trim();

  if (!prompt) return;

  addMessage(prompt, "user");

  const { answerHtml, cardsWrap } = getTopicAnswer(prompt);

  const botBubble = document.createElement("div");
  botBubble.className = "bubble";
  botBubble.innerHTML = answerHtml;

  const message = document.createElement("div");
  message.className = "message bot";

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = "AI";

  message.appendChild(avatar);
  message.appendChild(botBubble);
  chat.appendChild(message);

  const cardGroup = document.createElement("div");
  cardGroup.className = "answer-cards";
  cardGroup.appendChild(cardsWrap);

  chat.appendChild(cardGroup);
  chat.scrollTop = chat.scrollHeight;

  input.value = "";
}

form.addEventListener("submit", handleSubmit);

promptButtons.forEach((button) => {
  button.addEventListener("click", () => {
    input.value = button.textContent;
    form.requestSubmit();
  });
});

navItems.forEach((button) => {
  button.addEventListener("click", () => {
    navItems.forEach((el) => el.classList.remove("active"));
    button.classList.add("active");
  });
});
