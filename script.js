const chat = document.getElementById("chat");
const form = document.getElementById("chat-form");
const input = document.getElementById("question");

const knowledge = {
  world: {
    title: "Earth",
    image:
      "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1200&q=80",
    response:
      "Earth is the third planet from the Sun and the only known planet that supports life. It has oceans, atmosphere, weather, and a rich variety of ecosystems.",
    facts: [
      { label: "Type", text: "Rocky planet" },
      { label: "Age", text: "About 4.5 billion years old" },
      { label: "Water", text: "About 71% of Earth is covered by water" }
    ]
  },
  galaxy: {
    title: "Galaxy",
    image:
      "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=1200&q=80",
    response:
      "A galaxy is a massive system of stars, gas, dust, and dark matter held together by gravity. Our home galaxy is the Milky Way.",
    facts: [
      { label: "Home", text: "The Milky Way galaxy" },
      { label: "Size", text: "Contains hundreds of billions of stars" },
      { label: "Shape", text: "Usually spiral or elliptical" }
    ]
  },
  planet: {
    title: "Planets",
    image:
      "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?auto=format&fit=crop&w=1200&q=80",
    response:
      "The solar system has eight planets: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune.",
    facts: [
      { label: "Inner", text: "Mercury, Venus, Earth, Mars" },
      { label: "Outer", text: "Jupiter, Saturn, Uranus, Neptune" },
      { label: "Largest", text: "Jupiter is the biggest planet" }
    ]
  },
  saturn: {
    title: "Saturn",
    image:
      "https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&w=1200&q=80",
    response:
      "Saturn is known for its giant rings made mostly of ice and rock particles.",
    facts: [
      { label: "Rings", text: "Wide but extremely thin" },
      { label: "Moons", text: "Has many moons including Titan" },
      { label: "Type", text: "Gas giant" }
    ]
  },
  space: {
    title: "Space",
    image:
      "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1200&q=80",
    response:
      "Space is the vast region beyond Earth’s atmosphere. It contains stars, planets, galaxies, black holes, and deep emptiness.",
    facts: [
      { label: "Universe", text: "The observable universe is vast" },
      { label: "Stars", text: "Stars are massive spheres of hot gas" },
      { label: "Black holes", text: "Some regions have extreme gravity" }
    ]
  },
  moon: {
    title: "Moon",
    image:
      "https://images.unsplash.com/photo-1502134249126-9f3755a50d4d?auto=format&fit=crop&w=1200&q=80",
    response:
      "The Moon is Earth's natural satellite and helps cause ocean tides and shapes the night sky.",
    facts: [
      { label: "Distance", text: "About 384,400 km away" },
      { label: "Orbit", text: "Completes one orbit every 27.3 days" },
      { label: "Surface", text: "Covered with craters and rock" }
    ]
  },
  star: {
    title: "Star",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    response:
      "A star is a giant glowing sphere of hot plasma powered by nuclear fusion.",
    facts: [
      { label: "Sun", text: "Our Sun is a star" },
      { label: "Life cycle", text: "Stars are born, live, and die" },
      { label: "Light", text: "Stars give off heat and light" }
    ]
  },
  default: {
    title: "Universe fact",
    image:
      "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=1200&q=80",
    response:
      "The universe is huge and full of galaxies, stars, planets, and mysteries we are still discovering.",
    facts: [
      { label: "Scale", text: "The universe is unimaginably large" },
      { label: "Light years", text: "Distances are measured in light-years" },
      { label: "Discovery", text: "New worlds are still being found" }
    ]
  }
};

function buildResponse(question) {
  const lower = question.toLowerCase();

  let result = knowledge.default;

  for (const [key, value] of Object.entries(knowledge)) {
    if (key === "default") continue;

    const matches = value.title.toLowerCase();
    const keywords = key.split("");

    if (
      lower.includes(key) ||
      lower.includes(value.title.toLowerCase()) ||
      lower.includes("earth") && key === "world" ||
      lower.includes("planet") && key === "planet" ||
      lower.includes("galaxy") && key === "galaxy" ||
      lower.includes("space") && key === "space" ||
      lower.includes("saturn") && key === "saturn" ||
      lower.includes("moon") && key === "moon" ||
      lower.includes("star") && key === "star"
    ) {
      result = value;
      break;
    }
  }

  return result;
}

function renderMessage(text, type = "user") {
  const row = document.createElement("div");
  row.className = `message ${type}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = "AI";

  if (type === "user") {
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = text;
    row.appendChild(bubble);
    chat.appendChild(row);
    return;
  }

  const content = document.createElement("div");
  content.className = "bot-content";

  const heading = document.createElement("h2");
  heading.textContent = result.title;

  const image = document.createElement("div");
  image.className = "hero-image";
  image.style.backgroundImage = `url('${result.image}')`;

  const body = document.createElement("p");
  body.textContent = result.response;

  const factGrid = document.createElement("div");
  factGrid.className = "fact-grid";

  result.facts.forEach((fact) => {
    const factBox = document.createElement("div");
    factBox.className = "fact-box";

    const factTitle = document.createElement("h4");
    factTitle.textContent = fact.label;

    const factText = document.createElement("p");
    factText.textContent = fact.text;

    factBox.appendChild(factTitle);
    factBox.appendChild(factText);
    factGrid.appendChild(factBox);
  });

  row.appendChild(avatar);
  content.appendChild(heading);
  content.appendChild(image);
  content.appendChild(body);
  content.appendChild(factGrid);
  row.appendChild(content);
  chat.appendChild(row);
}

function handleSubmit(event) {
  event.preventDefault();
  const question = input.value.trim();

  if (!question) return;

  const userRow = document.createElement("div");
  userRow.className = "message user";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = question;

  userRow.appendChild(bubble);
  chat.appendChild(userRow);

  const result = buildResponse(question);

  const botRow = document.createElement("div");
  botRow.className = "message bot";

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = "AI";

  const content = document.createElement("div");
  content.className = "bot-content";

  const heading = document.createElement("h2");
  heading.textContent = result.title;

  const image = document.createElement("div");
  image.className = "hero-image";
  image.style.backgroundImage = `url('${result.image}')`;

  const body = document.createElement("p");
  body.textContent = result.response;

  const factGrid = document.createElement("div");
  factGrid.className = "fact-grid";

  result.facts.forEach((fact) => {
    const factBox = document.createElement("div");
    factBox.className = "fact-box";

    const factTitle = document.createElement("h4");
    factTitle.textContent = fact.label;

    const factText = document.createElement("p");
    factText.textContent = fact.text;

    factBox.appendChild(factTitle);
    factBox.appendChild(factText);
    factGrid.appendChild(factBox);
  });

  botRow.appendChild(avatar);
  content.appendChild(heading);
  content.appendChild(image);
  content.appendChild(body);
  content.appendChild(factGrid);
  botRow.appendChild(content);
  chat.appendChild(botRow);

  chat.scrollTop = chat.scrollHeight;
  input.value = "";
}

form.addEventListener("submit", handleSubmit);
