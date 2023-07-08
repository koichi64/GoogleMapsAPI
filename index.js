var map;
var markerInfos = [];
var selectedIcon;
let selectedMapType;
let selectedMarkerIndex;
let searchLog = [];
let markerInfo;
let panorama;

// http://waox.main.jp/news/?page_id=229
let icons = {
  blue: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
  green: "http://maps.google.co.jp/mapfiles/ms/icons/green-dot.png",
  ltblue: "http://maps.google.co.jp/mapfiles/ms/icons/ltblue-dot.png",
  red: "http://maps.google.co.jp/mapfiles/ms/icons/red-dot.png",
  yellow: "http://maps.google.co.jp/mapfiles/ms/icons/yellow-dot.png",
  purple: "http://maps.google.co.jp/mapfiles/ms/icons/purple-dot.png",
  pink: "http://maps.google.co.jp/mapfiles/ms/icons/pink-dot.png",
  orange: "http://maps.google.co.jp/mapfiles/ms/icons/orange-dot.png",
};

let mapTypes = {
  ROADMAP: google.maps.MapTypeId.ROADMAP,
  SATELLITE: google.maps.MapTypeId.SATELLITE,
  HYBRID: google.maps.MapTypeId.HYBRID,
  TERRAIN: google.maps.MapTypeId.TERRAIN,
};

let defaultPositionDatas = config.defaultPositionDatas;

class MarkerController {
  get index() {
    return document.getElementById("selectMarker").selectedIndex;
  }
  set index(value) {
    document.getElementById("selectMarker").selectedIndex = value;
    console.log(
      "seletedIndex",
      document.getElementById("selectMarker").selectedIndex
    );
  }

  get marker() {
    return markerInfos[this.index].marker;
  }

  updateMarkerInfo(index) {
    this.index = markerInfos.length - 1;
  }

  moveToMarker() {
    const dstpoint = markerInfos[this.index].latlng;
    map.panTo(dstpoint);
    panorama.setPosition(dstpoint);
  }
}

// Set map
function initialize() {
  const fenway = new google.maps.LatLng(0, 0);
  var mapOptions = {
    zoom: 10,
    center: fenway,
    minZoom: 2,
  };

  map = new google.maps.Map(document.getElementById("map"), mapOptions);

  panorama = new google.maps.StreetViewPanorama(
    document.getElementById("pano"),
    {
      position: fenway,
      pov: {
        heading: 34,
        pitch: 10,
      },
    }
  );

  map.setStreetView(panorama);

  markerInfo = new MarkerController();
  createInitialMarkers();

  setOptions();
  setEvents();
}

// ----------------------------------------------------------------
// Options
function removeChildren(x) {
  if (x.hasChildNodes()) {
    while (x.childNodes.length > 0) {
      x.removeChild(x.firstChild);
    }
  }
}

function addOptions(selectName, optionDict) {
  let select = document.getElementById(selectName);
  removeChildren(select);
  for (const [key, value] of Object.entries(optionDict)) {
    let option = document.createElement("option");
    option.text = key;
    option.value = value;
    select.appendChild(option);
  }
}

function setOptions() {
  setIconOption();
  setMapTypeOption();
  setMarkerOptions();
}

function setIconOption() {
  addOptions("selectIcon", icons);
  changeIconColor();
  addOptions("selectedMarkerIcon", icons);
}

// 選択されているアイコンを設定
function changeIconColor() {
  selectedIcon = document.getElementById("selectIcon").value;
}

function changeMarker() {
  console.log(markerInfo.marker);
  markerInfo.moveToMarker();
}

// マーカーを再作成して色変更
function changeMarkerIconColor() {
  place = markerInfo.marker.title;
  // 一度削除
  deleteSelectedMarker();
  //　アイコンの色を変更
  selectedIcon = document.getElementById("selectedMarkerIcon").value;
  // マーカーを再作成
  searchAndMark(place);
  //　アイコンの色を元に戻す
  changeIconColor();
}

function setMapTypeOption() {
  addOptions("selectMapType", mapTypes);
  changeMapType();
}

function changeMapType() {
  selectedMapType = document.getElementById("selectMapType").value;
  map.setMapTypeId(selectedMapType);
}

function setMarkerOptions() {
  markerTitleList = {};
  markerInfos.forEach(
    (item) => (markerTitleList[item.marker.title] = item.marker.title)
  );
  console.log("markerTitleList", markerTitleList);
  addOptions("selectMarker", markerTitleList);
}

// Marker
function createInitialMarkers() {
  for (let key in defaultPositionDatas) {
    let position_data = defaultPositionDatas[key];
    let latlng = new google.maps.LatLng(position_data.x, position_data.y);
    createMarker(latlng, position_data.place, position_data.address);
    defaultPositionDatas[key][latlng] = latlng;
  }
}

function createMarker(latlng, place, address, icon = icons.red) {
  console.log("createMarker", latlng, place, address, icon);
  isExist = markerInfos.some((markerInfo) => markerInfo.place === place);
  if (isExist) {
    console.log(`${place} is already created.`);
    return;
  }
  let marker = new google.maps.Marker({
    position: latlng,
    map: map,
    title: place,
    icon: icon,
  });
  markerInfos.push({
    marker: marker,
    place: place,
    latlng: latlng,
    address: address,
  });
  console.log("All markers", markerInfos);
  let infoWindow = setInfoW(place, latlng, address);
  infoWindow.open(map, marker);
  marker.addListener("click", function () {
    infoWindow.open(map, marker);
  });
  setMarkerOptions();
  markerInfo.updateMarkerInfo(markerInfos.length - 1);
  markerInfo.moveToMarker();
}

function deleteMarker(index) {
  marker = markerInfos[index].marker;
  searchLog = searchLog.filter((place) => place != marker.title);
  marker.setMap(null);
  markerInfos.splice(index, 1);
  setMarkerOptions();
  console.log("deleteMarker:", marker);
}

function deleteSelectedMarker() {
  deleteMarker(markerInfo.index);
}

function deleteLastMarker() {
  deleteMarker(markerInfos.length - 1);
}

function deleteMakers() {
  setMapOnAll(null);
  markerInfos = [];
  searchLog = [];
  setMarkerOptions();
  console.log("deleteMakers:", markerInfos);
}

function setMapOnAll(map) {
  for (let i = 0; i < markerInfos.length; i++) {
    markerInfos[i].setMap(map);
  }
}

function setInfoW(place, latlng, address) {
  let content = `<a href='http://www.google.com/search?q=${place}' target='_blank'>${place}`;
  let memo = document.getElementById("memo").value;
  if (memo) {
    content += `<br>${memo}`;
    document.getElementById("memo").value = "";
  }
  return new google.maps.InfoWindow({
    content: content,
  });
}

function searchAndMark(place) {
  searchLog.push(place);
  console.log("searchLog: " + searchLog);
  var geocoder = new google.maps.Geocoder();
  let icon = selectedIcon;

  geocoder.geocode(
    {
      address: place,
    },
    function (results, status) {
      console.log("検索結果：", results);
      if (status == google.maps.GeocoderStatus.OK) {
        var bounds = new google.maps.LatLngBounds();

        if (results[0].geometry) {
          let result = results[0];
          var latlng = result.geometry.location;
          var address = result.formatted_address;
          bounds.extend(latlng);
          createMarker(latlng, place, address, icon);
        }
      } else if (status == google.maps.GeocoderStatus.ZERO_RESULTS) {
        alert("見つかりません");
      } else {
        console.error(status);
        alert("エラー発生");
      }
    }
  );
}

function setEvents() {
  document.getElementById("delete").addEventListener("click", function () {
    deleteSelectedMarker();
  });

  document.getElementById("deleteLast").addEventListener("click", function () {
    deleteLastMarker();
  });

  document.getElementById("clear").addEventListener("click", function () {
    deleteMakers();
  });

  document.getElementById("save").addEventListener("click", function () {
    saveMarker();
  });

  document.forms.setting.read.addEventListener("change", function (e) {
    let file = e.target.files[0];
    readMarker(file);
  });

  google.maps.event.addDomListener(window, "resize", function () {
    map.setCenter(mapOptions.center);
  });

  // 検索実行ボタンが押下されたとき
  document.getElementById("search").addEventListener("click", function () {
    var place = document.getElementById("keyword").value;
    searchAndMark(place);
  });

  // a (or left arrow key)* – rotate camera 45 degrees to the left.
  // d (or right arrow key) – rotate camera 45 degrees to the right.
  // w (or PageUp key) – look up towards the sky. (os x: go forward)
  // s (or PageDown key) – look down towards the ground (os x: go backwards).
  // up arrow **,*** – go forward
  // down arrow**,*** – go backward
  // + (plus key) – zoom in for a close-up view.
  // – (minus key) – zoom out one level.
  // double click the circle: jump the that view point
  // double click the rectangle: zoom in to that point.
  // TAB key: access various controls on the screen
  // Numerical 3 key: Turn on/off 3D mode.
}

// settings
function saveMarker() {
  const blob = new Blob([searchLog.join(",")], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "searchLog.csv";
  link.click();
}

function readMarker(file) {
  let reader = new FileReader();
  reader.readAsText(file);
  reader.addEventListener("load", function () {
    placeDatas = reader.result.split(",");
    console.log(placeDatas);
    for (place of placeDatas) {
      searchAndMark(place);
    }
  });
}

// Initialize the map when window loading finished
google.maps.event.addDomListener(window, "load", initialize);

// // スクロールを禁止にする関数
// function disableScroll(event) {
//   event.preventDefault();
// }
// document.addEventListener("touchmove", disableScroll, { passive: false });
// document.addEventListener("mousewheel", disableScroll, { passive: false });
