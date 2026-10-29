/* ============================================================
   data.js — every word and number the Cosmos app needs.
   Plain UMD so the browser and the Node tests share one source.
   ============================================================ */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.CosmosData = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const chapters = [
    {
      id: 'earth',
      num: '01',
      kicker: 'Home world',
      title: 'The world under your feet',
      lede: 'A rocky planet with liquid water, a protective atmosphere and a magnetic shield — so far the only place in the universe known to host life.',
      scene: 'earth',
      caption: 'Drag the globe to spin it. Warm dots on the night side are city lights.',
      narration: [
        'Earth is the third planet from the Sun: a ball of rock and metal 12,742 kilometres across. From space it looks blue because about 71 per cent of its surface is ocean — the thin layer of liquid water that makes this world so unusual.',
        'A blanket of gas called the atmosphere keeps the surface warm enough for water to stay liquid. Nitrogen makes up 78 per cent of it and oxygen 21 per cent, with traces of argon, carbon dioxide and water vapour. The natural greenhouse effect keeps us comfortable; strengthening it with extra carbon dioxide is what is warming the climate now.',
        'Below the crust, hot rock creeps in slow convection currents. That motion drives plate tectonics, so continents drift, mountains rise and volcanoes recycle carbon between the deep Earth and the air. A churning iron core generates the magnetic field that deflects much of the solar wind.',
        'Earth turns once every 23 hours 56 minutes and orbits the Sun once every 365.25 days. Its axis is tilted 23.4 degrees, which is why we have seasons. The Moon, 384,400 kilometres away, steadies that tilt and raises the tides.'
      ],
      stats: [
        { value: '12,742 km', label: 'mean diameter' },
        { value: '71%', label: 'covered by ocean' },
        { value: '23.4°', label: 'axial tilt' },
        { value: '4.54 bn yr', label: 'age' }
      ],
      fact: 'Earth is the densest planet in the Solar System — roughly 5.5 grams per cubic centimetre on average.'
    },
    {
      id: 'system',
      num: '02',
      kicker: 'The neighbourhood',
      title: 'One star, eight planets, endless debris',
      lede: 'The Solar System is a 4.6-billion-year-old disk of leftovers around an ordinary yellow star.',
      scene: 'system',
      caption: 'Click a planet to inspect it. Sizes, distances and speeds are not to scale.',
      narration: [
        'The Sun holds 99.86 per cent of the mass of the Solar System. Every second it fuses about 600 million tonnes of hydrogen into helium, and the light that leaves its surface takes roughly 8 minutes and 20 seconds to reach Earth.',
        'Close in are four rocky worlds: Mercury, Venus, Earth and Mars. Beyond the asteroid belt sit the giants — Jupiter with its storm bands, ringed Saturn, and the ice giants Uranus and Neptune. Farther still is the Kuiper belt, home to Pluto and countless icy bodies, wrapped in a vast, thinly populated Oort cloud.',
        'Only Earth keeps liquid water on its surface. Venus suffered a runaway greenhouse effect and now bakes at about 464 degrees Celsius, while Mars lost most of its air and is a cold desert of iron-rich dust.',
        'Our robotic reach is already interstellar: Voyager 1, launched in 1977, is more than 25 billion kilometres away and has been travelling through interstellar space since 2012. Even at that speed, reaching the nearest star would take tens of thousands of years.'
      ],
      stats: [
        { value: '8', label: 'planets' },
        { value: '4.6 bn yr', label: 'age of the system' },
        { value: '8 min 20 s', label: 'sunlight to Earth' },
        { value: '167 AU', label: 'Voyager 1 in 2025' }
      ],
      fact: 'A day on Venus is longer than its year: the planet turns once in 243 Earth days but completes an orbit in 225.'
    },
    {
      id: 'galaxy',
      num: '03',
      kicker: 'Our galaxy',
      title: 'A city of a hundred billion suns',
      lede: 'The Milky Way is a barred spiral galaxy — a flat, rotating disk of stars, gas and dust with a supermassive black hole at its heart.',
      scene: 'galaxy',
      caption: 'The disk turns slowly. Drag the slider to zoom, or pause the spin.',
      narration: [
        'The Milky Way is roughly 100,000 light-years across and contains somewhere between 100 and 400 billion stars. The Sun sits about 26,000 light-years from the centre, on a quiet stretch of one arm, and takes around 230 million years to complete one lap.',
        'Look at the structure from above and you would see a bright central bulge, a bar of older stars, and several sweeping spiral arms where gas is compressed and new stars ignite. A thin disk of stars and dust is wrapped in a spherical halo of ancient star clusters and, apparently, far more dark matter than visible matter.',
        'At the centre lies Sagittarius A*, a black hole about 4.3 million times the mass of the Sun. The Event Horizon Telescope released its first image in 2022. Closer in, individual stars whip around it — the star S2 completes an orbit in only 16 years.',
        'Stars are born in cold nebulae and die as white dwarfs, neutron stars or black holes. In their cores they forge carbon, oxygen, iron and the rest of the periodic table, then scatter it in winds and explosions. The calcium in your bones was made inside a star.'
      ],
      stats: [
        { value: '~100,000 ly', label: 'across' },
        { value: '100–400 bn', label: 'stars' },
        { value: '26,000 ly', label: 'Sun to centre' },
        { value: '230 mn yr', label: 'one galactic year' }
      ],
      fact: 'The Milky Way and Andromeda are approaching each other and should begin to merge in about 4.5 billion years.'
    },
    {
      id: 'beyond',
      num: '04',
      kicker: 'Beyond the Milky Way',
      title: 'Island universes and our cosmic address',
      lede: 'Our galaxy is one of trillions, arranged into groups, clusters and vast filaments inside an expanding universe.',
      narration: [
        'A century ago astronomers thought the Milky Way was the whole universe. Then Edwin Hubble measured variable stars in Andromeda and showed it lies far beyond our own galaxy — a separate island universe, 2.5 million light-years away.',
        'Galaxies come in shapes: grand spiral disks, barred spirals like ours, smooth ellipsoids, thin lenticulars and messy irregulars. Many are dwarfs. Collisions and mergers are normal, and they are how small galaxies grow into big ones. Counts from deep surveys suggest the observable universe holds on the order of two trillion galaxies.',
        'We live in the Local Group, at least 80 galaxies bound together across about 10 million light-years. That group sits on the edge of the Virgo Cluster, inside a supercluster named Laniakea — roughly 100,000 galaxies spread over 520 million light-years.',
        'The universe is 13.8 billion years old, and the part we can see is now about 93 billion light-years across because space itself has stretched. Ordinary matter is only about 5 per cent of the contents; dark matter is around 27 per cent and dark energy around 68 per cent, and it is dark energy that is accelerating the expansion.'
      ],
      stats: [
        { value: '~2 trillion', label: 'galaxies (estimate)' },
        { value: '2.5 mn ly', label: 'to Andromeda' },
        { value: '93 bn ly', label: 'observable universe' },
        { value: '13.8 bn yr', label: 'age of the universe' }
      ],
      fact: 'If the Sun were the size of a grapefruit, the nearest star system would be about 4,000 kilometres away.'
    }
  ];

  const planets = [
    {
      id: 'mercury', name: 'Mercury', type: 'Rocky planet',
      color: '#b9b3a8', dark: '#6d675f', size: 3.4, orbit: 52, period: 0.24, phase: 0.6,
      stats: [{ value: '88 days', label: 'year' }, { value: '4,879 km', label: 'diameter' }, { value: '0.39 AU', label: 'from Sun' }],
      blurb: 'Smallest planet and fastest orbiter. Almost no atmosphere, so days scorch at 430 °C and nights freeze at -180 °C.'
    },
    {
      id: 'venus', name: 'Venus', type: 'Rocky planet',
      color: '#e8c07a', dark: '#9d7334', size: 5.4, orbit: 70, period: 0.62, phase: 2.1,
      stats: [{ value: '225 days', label: 'year' }, { value: '12,104 km', label: 'diameter' }, { value: '464 °C', label: 'surface' }],
      blurb: 'Earth\u2019s twin in size, ruined by a runaway greenhouse effect. Its thick carbon-dioxide air crushes and cooks.'
    },
    {
      id: 'earth', name: 'Earth', type: 'Rocky planet',
      color: '#4f9fe0', dark: '#1b4e7d', size: 5.7, orbit: 90, period: 1, phase: 4.2,
      stats: [{ value: '365.25 days', label: 'year' }, { value: '12,742 km', label: 'diameter' }, { value: '1 AU', label: 'from Sun' }],
      blurb: 'The only world known to have liquid surface water, plate tectonics and life. Its Moon stabilises a 23.4° axial tilt.'
    },
    {
      id: 'mars', name: 'Mars', type: 'Rocky planet',
      color: '#d1603d', dark: '#7d3018', size: 4.3, orbit: 110, period: 1.88, phase: 5.4,
      stats: [{ value: '687 days', label: 'year' }, { value: '6,779 km', label: 'diameter' }, { value: '0.006 bar', label: 'air pressure' }],
      blurb: 'A cold desert with the tallest volcano and deepest canyon in the Solar System, plus polar caps of water ice and CO₂.'
    },
    {
      id: 'jupiter', name: 'Jupiter', type: 'Gas giant',
      color: '#d9b08c', dark: '#8a5f3d', size: 13.5, orbit: 143, period: 11.86, phase: 1.1,
      stats: [{ value: '11.9 years', label: 'year' }, { value: '139,820 km', label: 'diameter' }, { value: '95+', label: 'known moons' }],
      blurb: 'More massive than every other planet combined. The Great Red Spot is a storm wider than Earth.'
    },
    {
      id: 'saturn', name: 'Saturn', type: 'Gas giant',
      color: '#e3d3a3', dark: '#9c8652', size: 11.4, orbit: 176, period: 29.45, phase: 3.4,
      stats: [{ value: '29.4 years', label: 'year' }, { value: '116,460 km', label: 'diameter' }, { value: '~70,000 km/h', label: 'ring particle speed' }],
      blurb: 'Its rings are billions of ice and rock chunks, most smaller than a house, spanning 280,000 km but only tens of metres thick.'
    },
    {
      id: 'uranus', name: 'Uranus', type: 'Ice giant',
      color: '#8fd6e0', dark: '#3f8b96', size: 8.0, orbit: 207, period: 84.0, phase: 0.2,
      stats: [{ value: '84 years', label: 'year' }, { value: '50,724 km', label: 'diameter' }, { value: '97.8°', label: 'axial tilt' }],
      blurb: 'Knocked onto its side, Uranus rolls around the Sun. Methane in its atmosphere gives it a pale cyan colour.'
    },
    {
      id: 'neptune', name: 'Neptune', type: 'Ice giant',
      color: '#4a6fe0', dark: '#233f8f', size: 7.7, orbit: 236, period: 164.8, phase: 2.7,
      stats: [{ value: '164.8 years', label: 'year' }, { value: '49,244 km', label: 'diameter' }, { value: '2,100 km/h', label: 'winds' }],
      blurb: 'The windiest planet, with supersonic storms. It was found by mathematics before anyone saw it through a telescope.'
    }
  ];

  const galaxyTypes = [
    { name: 'Spiral', icon: 'spiral', blurb: 'A rotating disk with bright arms of young stars, gas and dust around an older bulge. The Milky Way is this kind of galaxy, with a bar.' },
    { name: 'Barred spiral', icon: 'barred', blurb: 'A spiral whose arms begin at the ends of a straight bar of stars. Roughly two thirds of spiral galaxies, including ours, have bars.' },
    { name: 'Elliptical', icon: 'elliptical', blurb: 'Smooth, rounded swarms of mostly old stars with little cold gas. They range from dwarfs to the largest galaxies known and grow by mergers.' },
    { name: 'Lenticular', icon: 'lenticular', blurb: 'A disk galaxy that has used up or lost its star-forming gas: a bulge and disk, but no spiral arms.' },
    { name: 'Irregular', icon: 'irregular', blurb: 'No clear shape, often small and gas-rich, lit by bursts of star formation. The Magellanic Clouds are irregular satellites of the Milky Way.' },
    { name: 'Dwarf', icon: 'dwarf', blurb: 'The most common galaxies in the universe are tiny ones with millions rather than billions of stars, orbiting larger galaxies or drifting alone.' }
  ];

  const deepSpace = [
    { name: 'Nebula', blurb: 'Clouds of hydrogen, helium and dust. Some are stellar nurseries; others are the shredded remains of dying stars. The Orion Nebula is visible to the naked eye.' },
    { name: 'Star cluster', blurb: 'Open clusters are young siblings born from one cloud, like the Pleiades. Globular clusters are dense, ancient balls of hundreds of thousands of stars orbiting the galactic halo.' },
    { name: 'Black hole', blurb: 'A region where gravity is so strong that light cannot escape. Stellar-mass black holes form in supernovae; supermassive ones sit in galaxy centres.' },
    { name: 'Neutron star', blurb: 'The collapsed core of a massive star, packing more than the Sun\u2019s mass into a city-sized sphere. Some spin as pulsars, sweeping beams across space.' },
    { name: 'Exoplanet', blurb: 'A planet orbiting another star. Nearly 6,000 are confirmed and thousands more await verification; some sit in the habitable zone where liquid water could exist.' },
    { name: 'Quasar', blurb: 'The brilliant, growing black hole at the centre of an active galaxy. Quasars can outshine their entire host galaxy and are seen across billions of light-years.' }
  ];

  const cosmicAddress = [
    { name: 'Earth', note: 'a rocky planet 12,742 km across, orbiting one ordinary star' },
    { name: 'Earth–Moon system', note: 'the Moon circles us at 384,400 km and steadies our tilt' },
    { name: 'Solar System', note: 'eight planets within about 4.5 light-hours, wrapped in the Oort cloud' },
    { name: 'Milky Way', note: '100,000 light-years across; we sit 26,000 light-years from the centre' },
    { name: 'Local Group', note: 'at least 80 galaxies within roughly 10 million light-years' },
    { name: 'Laniakea', note: 'our supercluster: about 100,000 galaxies across 520 million light-years' },
    { name: 'Observable universe', note: '93 billion light-years across, 13.8 billion years old' }
  ];

  const quiz = [
    {
      q: 'Roughly how much of Earth\u2019s surface is covered by ocean?',
      options: ['About 30%', 'About 50%', 'About 71%', 'About 90%'],
      answer: 2,
      why: 'The oceans cover about 71 per cent of the surface, which is why Earth looks blue from space.'
    },
    {
      q: 'What keeps Earth\u2019s surface warm enough for liquid water?',
      options: ['The Moon\u2019s gravity', 'The greenhouse effect in the atmosphere', 'Friction from the planet spinning', 'Heat from the iron core alone'],
      answer: 1,
      why: 'Gases such as carbon dioxide and water vapour trap outgoing infrared radiation, raising the average surface temperature.'
    },
    {
      q: 'One astronomical unit (AU) is the distance from Earth to…',
      options: ['The Moon', 'The Sun', 'The nearest star', 'The galactic centre'],
      answer: 1,
      why: 'One AU is about 149.6 million kilometres, the mean Earth–Sun distance.'
    },
    {
      q: 'Which planet in our Solar System is the largest?',
      options: ['Saturn', 'Neptune', 'Jupiter', 'Earth'],
      answer: 2,
      why: 'Jupiter is about 11 times wider than Earth and more massive than all the other planets combined.'
    },
    {
      q: 'How long does sunlight take to reach Earth?',
      options: ['About 8 seconds', 'About 8 minutes', 'About 8 hours', 'About 8 days'],
      answer: 1,
      why: 'Light covers 1 AU in roughly 500 seconds — 8 minutes and 20 seconds.'
    },
    {
      q: 'What kind of galaxy is the Milky Way?',
      options: ['Elliptical', 'Irregular', 'Barred spiral', 'Lenticular'],
      answer: 2,
      why: 'The Milky Way is a barred spiral: arms sweep out from the ends of a central bar of older stars.'
    },
    {
      q: 'How far is the Sun from the centre of the Milky Way?',
      options: ['About 260 light-years', 'About 2,600 light-years', 'About 26,000 light-years', 'About 26 million light-years'],
      answer: 2,
      why: 'The Sun orbits about 26,000 light-years out from the galactic centre, completing one lap in roughly 230 million years.'
    },
    {
      q: 'What sits at the centre of our galaxy?',
      options: ['A giant star cluster', 'A supermassive black hole', 'A bright quasar', 'Nothing measurable'],
      answer: 1,
      why: 'Sagittarius A* has about 4.3 million times the Sun\u2019s mass. Its image was released by the Event Horizon Telescope in 2022.'
    },
    {
      q: 'Which star system is closest to the Sun?',
      options: ['Sirius', 'Alpha Centauri (including Proxima)', 'Betelgeuse', 'The Pleiades'],
      answer: 1,
      why: 'Proxima Centauri, part of the Alpha Centauri system, is about 4.24 light-years away.'
    },
    {
      q: 'How old is the universe?',
      options: ['4.6 billion years', '13.8 billion years', '100 billion years', '13.8 million years'],
      answer: 1,
      why: 'Measurements of the cosmic microwave background and the expansion rate give an age of about 13.8 billion years.'
    }
  ];

  const links = [
    { label: 'NASA — Solar System Exploration', url: 'https://science.nasa.gov/solar-system/' },
    { label: 'NASA Earth Observatory', url: 'https://earthobservatory.nasa.gov/' },
    { label: 'ESA — Space Science', url: 'https://www.esa.int/Science_Exploration/Space_Science' },
    { label: 'NASA — Universe', url: 'https://science.nasa.gov/universe/' }
  ];

  return { chapters, planets, galaxyTypes, deepSpace, cosmicAddress, quiz, links };
});

