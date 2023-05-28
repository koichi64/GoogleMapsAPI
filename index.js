var map;
var markers = [];
var selectedIcon;
let selectedMapType;

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

let position_data_list = {
  nagatuta: {
    x: 35.53262369999999,
    y: 139.4961895,
    place: "長津田",
    address: "",
    latlng: new google.maps.LatLng(35.53262369999999, 139.4961895),
  },
  nishityofu: {
    x: 35.6570844,
    y: 139.5300797,
    place: "西調布",
    address: "",
    latlng: new google.maps.LatLng(35.6570844, 139.5300797),
  },
};

// Set map
function initialize() {
  var mapOptions = {
    zoom: 10,
    center: new google.maps.LatLng(
      position_data_list.nagatuta.x,
      position_data_list.nagatuta.y
    ),
    minZoom: 2,
  };

  map = new google.maps.Map(document.getElementById("map"), mapOptions);

  setIconOption();
  setMapTypeOption();
  createInitialMarkers();

  setEvents();
}

// ----------------------------------------------------------------
// Options
function addOptions(selectName, optionDict) {
  let select = document.getElementById(selectName);
  for (const [key, value] of Object.entries(optionDict)) {
    let option = document.createElement("option");
    option.text = key;
    option.value = value;
    select.appendChild(option);
  }
}

function setIconOption() {
  addOptions("selectIcon", icons);
  changeIconColor();
}

function changeIconColor() {
  selectedIcon = document.getElementById("selectIcon").value;
}

function setMapTypeOption() {
  addOptions("selectMapType", mapTypes);
  changeMapType();
}

function changeMapType() {
  selectedMapType = document.getElementById("selectMapType").value;
  map.setMapTypeId(selectedMapType);
}

// Marker
function createInitialMarkers() {
  for (let key in position_data_list) {
    let position_data = position_data_list[key];
    let latlng = new google.maps.LatLng(position_data.x, position_data.y);
    createMarker(latlng, position_data.place, position_data.address);
    position_data_list[key][latlng] = latlng;
    console.log(position_data_list[key]);
  }
}

function createMarker(latlng, place, address, icon = icons.red) {
  markers.push(
    new google.maps.Marker({
      position: latlng,
      map: map,
      title: place,
      icon: icon,
    })
  );
  let marker = markers[markers.length - 1];
  let infoWindow = setInfoW(place, latlng, address);
  infoWindow.open(map, marker);
  marker.addListener("click", function () {
    infoWindow.open(map, marker);
  });
  console.log("createMarker");
  console.log(markers);
}

function deleteLastMarker() {
  markers[markers.length - 1].setMap(null);
  markers.pop();
  console.log("deleteLastMarker");
  console.log(markers);
}

function deleteMakers() {
  setMapOnAll(null);
  console.log("deleteMakers");
  console.log(markers);
}

function setMapOnAll(map) {
  for (let i = 0; i < markers.length; i++) {
    markers[i].setMap(map);
  }
}

// マーカーへの吹き出しの追加
function setInfoW(place, latlng, address) {
  let infoWindow = new google.maps.InfoWindow({
    content:
      "<a href='http://www.google.com/search?q=" +
      place +
      "' target='_blank'>" +
      place,
    //   place +
    //   "</a><br>" +
    //   latlng +
    //   "<br><br>" +
    //   address +
    //   "<br><a href='http://www.google.com/search?q=" +
    //   place +
    //   "&tbm=isch' target='_blank'>画像検索 by google</a>",
  });
  return infoWindow;
}

function setEvents() {
  document.getElementById("clear").addEventListener("click", function () {
    deleteMakers();
  });

  google.maps.event.addDomListener(window, "resize", function () {
    map.setCenter(mapOptions.center);
  });

  // 検索実行ボタンが押下されたとき
  document.getElementById("search").addEventListener("click", function () {
    var place = document.getElementById("keyword").value;
    var geocoder = new google.maps.Geocoder(); // geocoderのコンストラクタ

    geocoder.geocode(
      {
        address: place,
      },
      function (results, status) {
        console.log("検索結果：", results);
        if (status == google.maps.GeocoderStatus.OK) {
          var bounds = new google.maps.LatLngBounds();

          for (var i in results) {
            if (results[0].geometry) {
              let result = results[0];
              var latlng = result.geometry.location;
              var address = result.formatted_address;
              //   let place = result.address_components[0].long_name;
              //   document.getElementById("locationDisplay").innerText = address;
              // 検索結果地が含まれるように範囲を拡大
              bounds.extend(latlng);
              createMarker(latlng, place, address, selectedIcon);
            }
          }

          // マーカーの位置に移動
          map.panTo(latlng);
        } else if (status == google.maps.GeocoderStatus.ZERO_RESULTS) {
          alert("見つかりません");
        } else {
          console.error(status);
          alert("エラー発生");
        }
      }
    );
  });
}

// Initialize the map when window loading finished
google.maps.event.addDomListener(window, "load", initialize);
