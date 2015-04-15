var lyricsSyncInterval;
var syncedLyricsWithTiming;
var songTimingDelay=0;
var autoScroll=true;


function fetchLyrics (art,mus) {
	$("#top_bar").css("display","none");
	$("#status").html("<i>Fetching lyrics...</i>");
	var data = jQuery.data(document,art + mus); // cache read
	if (data) {
		validateLyrics(data, art, mus);
		return true;
	}

	var url = "http://api.vagalume.com.br/search.php"
		+"?art="+encodeURIComponent(art)
		+"&mus="+encodeURIComponent(mus);

	// Check if browser supports CORS - http://www.w3.org/TR/cors/
	if (!jQuery.support.cors) {
		url += "&callback=?";
	}

	jQuery.getJSON(url,function(data) {
		// What we do with the data
		jQuery.data(document,art + mus,data); // cache write
		validateLyrics(data, art, mus);
	}).fail(function(){
		// Something went wrong with the request. Alert the user
		$("#status").html("There was an error trying to reach the API.");
	});
}


function validateLyrics(data,art,mus){

	if (data.type == 'exact' || data.type == 'aprox') {
		fetchTiming(data);
	} else if (data.type == 'song_notfound') {
		// Song not found, but artist was found
		// You can list all songs from Vagalume here
		showInputFields("We could not find song <b>"+mus+"</b> by "+data.art.name, data.art.name, mus);
	} else {
		// Artist not found
		showInputFields("We could not find artist <b>"+art+"</b>", art, mus);
	}
}

function fetchTiming(trackData){
	$("#top_bar").css("display","none");
	$("#status").html("<i>Fetching timing...</i>");
	var timing = jQuery.data(document,trackData.mus[0].id+"timing"); // cache read
	if (timing) {
		validateTiming(trackData, timing);
		return true;
	}

	var url = "https://app2.vagalume.com.br/ajax/subtitle-get.php?action=getBestSubtitle"
		+"&pointerID="+trackData.mus[0].id
		+"&duration=999";

	// Check if browser supports CORS - http://www.w3.org/TR/cors/
	if (!jQuery.support.cors) {
		url += "&callback=?";
	}

	jQuery.getJSON(url,function(timingData) {
		// What we do with the data
		jQuery.data(document, trackData.mus[0].id+"timing", timingData); // cache write
		validateTiming(trackData, timingData);
	}).fail(function(){
		// Something went wrong with the request. Alert the user
		$("#status").html("There was an error trying to reach the API.");
	});

}

function validateTiming(trackData, timingData){
	if (timingData.subtitles) {
		showLyrics(trackData, timingData);
	} else {
		// Subtitle not found
		showLyrics (trackData);
	}
}


function showLyrics (trackData, timingData) {
	$("#status").css("padding-top","30px");
	var top = "<h2>"+trackData.mus[0].name + "</h2><br/><i>by <h4>" +trackData.art.name+"</h4></i><br/><br/>";

	if(timingData){
		// Timing found, show awesome lyrics
		$("#status").html(top);
		syncedLyricsWithTiming = timingData.subtitles[0].text_compressed;
		for(var i=0; i<syncedLyricsWithTiming.length; i++){
			$("#status").html($("#status").html() + "<p class=\"lyrics_line\">"+syncedLyricsWithTiming[i][0]+"</p>");
		}
		lyricsSyncInterval = setInterval(timeCheck, 300);
		$("#songTimingDelayUp").click(function(){songTimingDelay+=.5; $("#songTimingDelayStatus").text(songTimingDelay+" s")});
		$("#songTimingDelayDown").click(function(){songTimingDelay-=.5; $("#songTimingDelayStatus").text(songTimingDelay+" s")});
		$("#automatic_scroll").click(function(){autoScroll=true; $("#automatic_scroll").css("display","none")});
	} else {
		// No timing found, simply print lyrics text
		$("#status").html(top+trackData.mus[0].text);
	}
		$("#status").css("white-space", "pre");
		$("#top_bar").css("display","inherit");
		$("#new_window").click(function(){openPopup(trackData.art.name, trackData.mus[0].name, trackData.mus[0].text);});
		$("#wrong_lyric").click(function(){showInputFields("Wrong lyric?<br/>Please fill the form above and try a new search.", trackData.art.name, trackData.mus[0].name);});
}


var examples = [["Led Zeppelin","Kashmir"],
				["Queen","Bohemian Rhapsody"],
				["Kiss","Strutter"],
				["Pearl Jam","Even Flow"],
				["Bob Dylan","Like a Rolling Stone"],
				["John Lennon","Imagine"],
				["The Beatles","Hey Jude"],
				["Nirvana","Smells Like Teen Spirit"],
				["U2","One"],
				["Dire Straits","Sultans of Swing"],
				["Bon Jovi","Livin' on a Prayer"],
				["Led Zeppelin","Stairway to Heaven"],
				["Black Sabbath","Paranoid"],
				["Iron Maiden","The Number of the Beast"],
				["Sex Pistols","Anarchy in the UK"],
				["Aerosmith","Dream On"]];

function showInputFields(popupTitle, artist, track){
	$("#top_bar").css("display","none");
	var sortedExample = examples[Math.floor(Math.random()*examples.length)];
	$("#fix_song_info").css("display","inherit");
	$("#status").css("display","none");
	$("#fix_song_info_title").html(popupTitle);
	$("#fix_song_info_form_artist").attr("value", artist).attr("placeholder", 'e.g '+sortedExample[0]);
	$("#fix_song_info_form_track").attr("value", track).attr("placeholder", 'e.g '+sortedExample[1]);
	$('#fix_song_info_form').on('submit', function () {
		if(validateFormLength()){
			$("#fix_song_info").css("display","none");
			$("#status").css("display","inherit");
			fetchLyrics($("#fix_song_info_form_artist").val(), $("#fix_song_info_form_track").val());
		}
		return false; // para cancelar o envio do formulario
	});
	$('#fix_song_info_form_artist').keyup(validateFormLength);
	$('#fix_song_info_form_track').keyup(validateFormLength);
	validateFormLength();
}

function validateFormLength(){
	if($('#fix_song_info_form_artist').val().length>0 && $('#fix_song_info_form_track').val().length>0){
		$('#fix_song_info_form_submit').addClass('active');
		return true;
	} else {
		$('#fix_song_info_form_submit').removeClass('active');
		return false;
	}
}


$(document).ready(function(){
	$(window).bind('mousewheel DOMMouseScroll mousedown', function(event){
		$( 'html, body' ).stop( true );
        autoScroll=false;
		$("#automatic_scroll").css("display","inherit");
	});
})

function timeCheck(){
chrome.tabs.getSelected(null, function(tab) {
	chrome.tabs.sendMessage(tab.id, {query:"getPosition" },
		function(response) {

				if(response.position){
					$("#songTimingDelay").css("display", "inherit");
					for(var i=0; i<syncedLyricsWithTiming.length; i++){
						if(syncedLyricsWithTiming[i][2]>response.position-songTimingDelay){
							$( ".lyrics_line" ).removeClass( "current" );
							$( ".lyrics_line:eq("+i+")" ).addClass( "current" );
							if(autoScroll)
							$('html, body').animate({
								scrollTop: $(".current").offset().top-120
							}, 100);
							break;
						}
					}
				} 

		}
	);
});

}