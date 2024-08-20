const API_URL = "http://openapi.seoul.go.kr:8088";
const API_KEY = "";
const type = "json";
const SERVICE = "culturalEventInfo";
const CATEGORY = Object.freeze([
  {
    imgSrc: "./img/all.png",
    title: "전체",
    code: "%20",
  },
  {
    imgSrc: "./img/musical.png",
    title: "뮤지컬/오페라",
    code: "뮤지컬",
  },
  {
    imgSrc: "./img/classic.png",
    title: "클래식",
    code: "클래식",
  },
  {
    imgSrc: "./img/art.png",
    title: "전시/미술",
    code: "전시",
  },
  {
    imgSrc: "./img/korean-music.png",
    title: "국악",
    code: "국악",
  },
  {
    imgSrc: "./img/ballet.png",
    title: "무용",
    code: "무용",
  },
  {
    imgSrc: "./img/theater.png",
    title: "연극",
    code: "연극",
  },
  {
    imgSrc: "./img/concert.png",
    title: "콘서트",
    code: "콘서트",
  },
  {
    imgSrc: "./img/training.png",
    title: "교육/체험",
    code: "교육",
  },
  {
    imgSrc: "./img/festival.png",
    title: "축제",
    code: "축제",
  },
  {
    imgSrc: "./img/etc.png",
    title: "기타",
    code: "기타",
  },
]);
const LIMIT = 9;

const state = {
  codeName: "%20",
  currentCategory: 0,
  titleKeyword: "%20",
  dateKeyword: "%20",
  searchType: "title",
  searchError: "",
  totalEventCount: 0,
  events: [],
  pageSize: 1,
  page: 1,
  pageGroupSize: window.innerWidth < 1024 ? 5 : 10,
  currentPageLeft: null,
};
const elements = {
  $eventList: document.querySelector(".event-list"),
  $resultBox: document.querySelector(".cultural-events-sec .result-box"),
  $nav: document.querySelector(".nav-category"),
  $modalNav: document.querySelector(".modal-nav"),
  $searchFilter: document.querySelector(".search-filter"),
  $searchInput: document.querySelector(".search-input input"),
  $searchBtn: document.getElementById("search-btn"),
  $pageList: document.querySelector(".page-list"),
  $pageNavBtn: document.querySelectorAll(".pagination > button"),
  $categoryTab: document.querySelector(".category-tab"),
  $menuBtn: document.getElementById("menu-btn"),
  $closeBtn: document.getElementById("close-btn"),
  $modal: document.getElementById("modal"),
};

state.currentPageLeft = Math.ceil((state.pageGroupSize - 1) / 2);

/** CONST HTML */
const SKELETON_HTML = `<li class="event-skeleton">
    <div class="poster"></div>
    <div class="desc">
    <div></div>
    <div></div>
    <div></div>
    </div>
    </li>`;
const eventHtml = (eventInfo) => ` <div class="poster">
              <img src="${eventInfo.MAIN_IMG}" alt ="" />
                </div>
                <div class="desc">
                  <h3></h3>
                  <span></span>
                  <span></span>
                </div>
                <a href="${eventInfo.HMPG_ADDR}" target="_blank"></a>`;
const navHtml = (category) => `<div>
              <img src="${category.imgSrc}" alt="" />
            </div>
            <span>${category.title}</span>`;

/** func */
const showModal = (isShow) => {
  if (isShow) {
    elements.$modal.classList.add("show");
    return;
  }
  elements.$modal.classList.remove("show");
};

const hideResultBox = (hide) => {
  if (hide) {
    elements.$resultBox.style.display = "none";
    return;
  }
  elements.$resultBox.style.display = "flex";
};

const setResultMsg = () => {
  const [$keyword, $text] = elements.$resultBox.children;

  if (state.titleKeyword === "%20" && state.dateKeyword === "%20") {
    return;
  }

  hideResultBox(false);

  if (state.titleKeyword !== "%20") {
    $keyword.innerText = `"${decodeURIComponent(state.titleKeyword)}"`;
    $text.innerText = "제목으로 검색한 결과";
    return;
  }

  if (state.dateKeyword !== "%20") {
    $keyword.innerText = `"${state.dateKeyword}"`;
    $text.innerText = "날짜로 검색한 결과";
    return;
  }
};

const setCategoryTab = () => {
  const $tabCode = elements.$categoryTab.children[0];
  const $tabRes = elements.$categoryTab.children[1];

  $tabCode.innerText = `${CATEGORY[state.currentCategory].title}`;
  $tabRes.innerText = `${state.totalEventCount}건`;
};

const setLoading = (bool) => {
  if (bool) {
    let skelHtml = ``;
    for (let i = 0; i < 9; i++) {
      skelHtml += SKELETON_HTML;
    }
    elements.$eventList.innerHTML = skelHtml;
    return;
  }
  elements.$eventList.innerHTML = "";
};

const setCodeName = (code) => {
  if (code === "전체") {
    state.codeName = encodeURIComponent(" ");
    return;
  }
  state.codeName = encodeURIComponent(code);
};

const setSearchKeyword = (value) => {
  if (state.searchType === "title") {
    state.dateKeyword = "%20";
    state.titleKeyword = encodeURIComponent(value);
    return;
  }
  state.titleKeyword = "%20";
  state.dateKeyword = value;
};

const setPage = (idx) => {
  state.page = idx;
  renderEvents();
};

const fetchEvents = async () => {
  const data = await fetch(
    `${API_URL}/${API_KEY}/${type}/${SERVICE}/${(state.page - 1) * LIMIT + 1}/${
      state.page * LIMIT
    }/${state.codeName}/${state.titleKeyword}/${state.dateKeyword}`
  ).then(async (res) => {
    return await res.json();
  });

  if (!data.culturalEventInfo && data.RESULT.CODE === "INFO-200") {
    state.totalEventCount = 0;
    state.events = [];
    return;
  }

  const { list_total_count, row } = data.culturalEventInfo;

  state.totalEventCount = list_total_count;
  state.events = row;
};

const createEvents = (events) => {
  events.forEach((eventInfo) => {
    const $event = document.createElement("li");
    $event.classList.add("cultural-event");
    $event.innerHTML = eventHtml(eventInfo);

    const $desc = $event.querySelector(".desc");
    $desc.children[0].textContent = eventInfo.TITLE;
    $desc.children[1].textContent = eventInfo.PLACE;
    $desc.children[2].textContent = eventInfo.DATE;

    elements.$eventList.appendChild($event);
  });
};

const waitImagePreloads = (events) => {
  const images = [];

  events.forEach((event) => {
    const image = new Image();
    image.src = event.MAIN_IMG;
    images.push(image);
  });

  return Promise.allSettled(
    images.map(
      (image) =>
        new Promise((resolve, reject) => {
          image.onload = function () {
            resolve(image);
          };
          image.onerror = reject;
        })
    )
  );
};

const renderEvents = async () => {
  window.scrollTo({ top: 0 });
  setLoading(true);

  await fetchEvents();
  pagination();
  setCategoryTab();
  setResultMsg();
  await waitImagePreloads(state.events);

  setLoading(false);
  createEvents(state.events);
};

const createNav = (category, idx) => {
  const $navBtn = document.createElement("button");
  $navBtn.classList.add("nav-btn");
  $navBtn.innerHTML = navHtml(category);
  $navBtn.addEventListener("click", () => {
    handleCategoryClick(category, idx);
  });
  elements.$nav.appendChild($navBtn);

  const $modalNavBtn = $navBtn.cloneNode(true);
  $modalNavBtn.addEventListener("click", () => {
    handleCategoryClick(category, idx);
    showModal(false);
  });
  elements.$modalNav.appendChild($modalNavBtn);
};

const loadCategory = () => {
  CATEGORY.forEach((category, idx) => {
    createNav(category, idx);
  });
  updateNavClass();
};

const updateNavClass = () => {
  elements.$nav.childNodes.forEach((navBtn, idx) => {
    if (idx === state.currentCategory) {
      navBtn.classList.add("active");
      return;
    }
    navBtn.classList.remove("active");
  });

  elements.$modalNav.childNodes.forEach((navBtn, idx) => {
    if (idx === state.currentCategory) {
      navBtn.classList.add("active");
      return;
    }
    navBtn.classList.remove("active");
  });
};

const handleCategoryClick = (category, idx) => {
  elements.$searchInput.value = "";
  state.titleKeyword = "%20";
  state.dateKeyword = "%20";
  state.currentCategory = idx;

  updateCategory(category);
};

const updateCategory = async (category) => {
  hideResultBox(true);
  setCodeName(category.code);
  updateNavClass();
  setPage(1);
};

const pagination = () => {
  state.pageSize = Math.ceil(state.totalEventCount / LIMIT);
  let firstPage = Math.min(
    state.page - state.currentPageLeft,
    state.pageSize - (state.pageGroupSize - 1)
  );
  if (firstPage < 1) firstPage = 1;
  const lastPage = Math.min(
    state.pageSize,
    firstPage + (state.pageGroupSize - 1)
  );

  let pageHTML = ``;
  for (let i = firstPage; i <= lastPage; i++) {
    pageHTML += `<button
         class="${i === state.page ? "active" : ""}"
         onClick='setPage(${i})'
         >${i}</button>`;
  }

  elements.$pageList.innerHTML = pageHTML;
};

const validateInput = (value) => {
  if (state.searchType === "date") {
    const dateRegex =
      /^(\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01]))|(\d{4}-(0[1-9]|1[012]))|\d{4}$/;
    state.searchError = "날짜 형식이 맞지 않습니다.";
    return dateRegex.test(value);
  }
  state.searchError = "";
  return true;
};

const searchEvent = (value) => {
  if (!validateInput(value)) {
    alert(state.searchError);
    return;
  }
  hideResultBox(true);
  setSearchKeyword(value);
  setPage(1);
};

const filterEvent = (e) => {
  const { value } = e.target;

  elements.$searchInput.value = "";
  state.searchType = value;

  if (value === "date") {
    elements.$searchInput.setAttribute("placeholder", "YYYY-MM-DD");
  } else {
    elements.$searchInput.setAttribute("placeholder", "");
  }
};

const init = () => {
  renderEvents();
  loadCategory();
};

init();

elements.$pageNavBtn[0].addEventListener("click", () => {
  setPage(1);
});

elements.$pageNavBtn[1].addEventListener("click", () => {
  if (state.page < 2) {
    return;
  }
  setPage(state.page - 1);
});

elements.$pageNavBtn[2].addEventListener("click", () => {
  if (state.page >= state.pageSize) {
    return;
  }
  setPage(state.page + 1);
});

elements.$pageNavBtn[3].addEventListener("click", () => {
  setPage(state.pageSize);
});

elements.$searchFilter.addEventListener("change", filterEvent);
elements.$searchInput.addEventListener("keydown", (e) => {
  if (e.keyCode === 13) {
    searchEvent(elements.$searchInput.value);
  }
});
elements.$searchBtn.addEventListener("click", () => {
  searchEvent(elements.$searchInput.value);
});

elements.$menuBtn.addEventListener("click", () => {
  showModal(true);
});

elements.$closeBtn.addEventListener("click", () => {
  showModal(false);
});

window.addEventListener("resize", () => {
  const prevSize = state.pageGroupSize;
  state.pageGroupSize = window.innerWidth < 1000 ? 5 : 10;
  state.currentPageLeft = Math.ceil((state.pageGroupSize - 1) / 2);
  if (prevSize !== state.pageGroupSize) {
    pagination();
  }
});
