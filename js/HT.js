$( document ).ready(function () {
	/*
	----- Elementit -----
	*/

	//Suodatus
	var kategoria = document.getElementById('kategoria');
	var hakusana = document.getElementById('hakusana');
	var free = document.getElementById('free');
	var suodata = document.getElementById('suodata');

	//Sisalto-container
	var sisalto = document.getElementById('sisalto');

	//Modaali
	$('.modaali.tausta').click(function(event) {
		piilotaModaali(event);
	});

	function piilotaModaali(event) {
		if($(event.target).is($('.modaali.tausta'))
			|| $(event.target).is($('button'))) {
			$('.modaali').fadeOut();
			$('.modaali.panel-body').empty();
		}
	}

	suodata.addEventListener('click', function() {
		muodostaURL();
	});

	//Luodaan alkuun sisältöä
	muodostaURL();

	function muodostaURL() {
		var URL = 'https://visittampere.fi/api/search?type=event&lang=fi';

		if(hakusana.value)
			URL += "&text=" + hakusana.value;

		if(kategoria.value)
			URL += "&tag=" + kategoria.value;

		if(free.checked)
			URL += "&free=true";

		var pvm = new Date();
		URL += "&start_datetime=" + pvm.getTime();

		haeTiedot(URL);
	}

	function haeTiedot(URL) {
		var pyynto = $.ajax({
			url: URL,
			method: "GET",
			dataType: "text json"
		});
		
		pyynto.done(function(data) {
				naytaTiedot(data);
		});

		pyynto.fail(function(jqXHR, error) {
			alert("Tiedon nouto ei onnistunut.");
		});
	}

	function teePaivays(time) {
		var aika = new Date(time);
		var pp = aika.getDate();
		var mm = aika.getMonth();
		var vv = aika.getFullYear();
		var hh = aika.getHours();
		var min = aika.getMinutes();

		if(hh < 10 && hh >= 0)
			hh = "0" + hh;

		if(min < 10 && min >= 0)
			min = "0" + min;

		return pp + "." + mm + "." + vv + " klo " + hh + ":" + min;
	}

	function naytaTiedot(data) {
		$(sisalto).empty();
		poistaMerkit();

		var pvm = new Date();

		for(var i = 0; i < data.length; i++) {
			//Luodaan rakenteet
			var paneeli = document.createElement('DIV');
			$(paneeli).addClass("panel panel-default");
			$(paneeli).appendTo(sisalto);

			//Paneelin otsikko
			var otsikkoDiv = document.createElement('DIV');
			$(otsikkoDiv).addClass("panel-heading").text(data[i].title);
			$(otsikkoDiv).appendTo(paneeli);

			//Sisältö
			var sisaltoDiv = document.createElement('DIV');
			$(sisaltoDiv).addClass("panel-body").appendTo(paneeli);

			if(data[i].image) {
				var kuvaDiv = document.createElement('DIV');
				$(kuvaDiv).addClass("kuva").appendTo(sisaltoDiv);

				var kuva = document.createElement('IMG');
				kuva.src = data[i].image.src;
				kuva.title = data[i].image.title;
				$(kuva).addClass("img-rounded").appendTo(kuvaDiv);
			}

			var sisaltoWrap = document.createElement('DIV');
			$(sisaltoWrap).appendTo(sisaltoDiv).addClass("sisalto-wrapper");

			var contact = data[i].contact_info;

			//Sijaintiotsikko
			var sijainti;
			if(contact.address && contact.city)
				sijainti = contact.address + ", " + contact.city;
			else if(contact.address && contact.city)
				sijainti = contact.city;
			else
				sijainti = contact.address;
			var sijaintiOts = document.createElement('H3');
			$(sijaintiOts).text(sijainti).addClass("text-left");
			$(sijaintiOts).appendTo(sisaltoWrap);


			var kuvaus = document.createElement('P');
			$(kuvaus).text(data[i].description).addClass("text-left").appendTo(sisaltoWrap);
		
			if(contact.link) {
				var linkki = document.createElement('A');
				linkki.href = contact.link;
				$(linkki).text(contact.link.split("?")[0]).appendTo(sisaltoWrap);
			}

			//Tapahtuman ajat
			var aikaOts = document.createElement('H4');
			$(aikaOts).appendTo(sisaltoWrap);
			//Tarkistetaan toistuvuus
			if(data[i].single_datetime && data[i].start_datetime != null) {
				//Yksittäinen aika
				$(aikaOts).text("Tapahtuman ajankohta on " + teePaivays(data[i].start_datetime) + " - " + teePaivays(data[i].end_datetime));
			} else if (data[i].single_datetime && data[i].start_datetime == null) {
				$(aikaOts).text("Tapahtuman ajankohta ei ole tiedossa.");
			} else {
				//Useampi aika
				$(aikaOts).text("Tapahtuman tulevat ajankohdat:");
				var listaRak = document.createElement('UL');
				$(listaRak).appendTo(sisaltoWrap);

				var lisattyLaskuri = 0;
				for(var j = 0; j < data[i].times.length && j <= 3; j++) {
					if(pvm.getTime() < data[i].times[j].start_datetime) {
						var listaKoh = document.createElement('LI');
						$(listaKoh).appendTo(listaRak).text(teePaivays(data[i].times[j].start_datetime) + " - " + teePaivays(data[i].times[j].end_datetime));
						lisattyLaskuri++;
					}
				}

				if(lisattyLaskuri == 0)
					$(aikaOts).text("Tapahtuman kaikki ajankohdat ovat jo menneet.");
			}

			//Estetään viittaus väärään osoitteeseen functiolla
			(function () { 
				//Lisätään karttaan merkki
				var osoite = "";
				if(contact.address)
					osoite += contact.address + " ";
				if(contact.city)
					osoite += contact.city + " ";
				if(contact.postcode)
					osoite += contact.postcode;
				geokoodaaMerkki(osoite);

				//Painikkeet
				//Näytä kartta
				var btnGrp = document.createElement('DIV');
				$(btnGrp).appendTo(sisaltoWrap).addClass('btn-group napit');

				var naytaKartta = document.createElement('BUTTON');
				$(naytaKartta).addClass("btn btn-primary").text("Näytä kartalla")
				$(naytaKartta).appendTo(btnGrp);
				naytaKartta.addEventListener('click', function() {
					poistaMerkit();
					geokoodaaMerkki(osoite);
					//Siirretään käyttäjän näkymä karttaan
					$('html, body').animate({
				        scrollTop: $("#kartta").offset().top
				    }, 500);
				});

				//Modaalinen reittiohje-ikkuna
				var reittiohje = document.createElement('BUTTON');
				$(reittiohje).addClass("btn btn-success").text("Hae reittiohjeet")
				$(reittiohje).appendTo(btnGrp);
				reittiohje.addEventListener('click', function() {
					$('.modaali').fadeIn();
					var panel_body = $('.modaali.panel-body')[0];

					//Reittitietojen taustatiedot
					var formGrp = document.createElement('DIV');
					$(formGrp).appendTo(panel_body).addClass("form-inline form-group fixed");

					var label = document.createElement('LABEL');
					$(label).appendTo(formGrp).text("Lähtöosoite");

					var lahtoOsoite = document.createElement('INPUT');
					lahtoOsoite.setAttribute('type', 'text');
					$(lahtoOsoite).appendTo(formGrp).addClass("form-control");

					label = document.createElement('LABEL');
					$(label).appendTo(formGrp).text("Liikkumistapa");
					var liikkumisTapa = document.createElement('SELECT');
					$(liikkumisTapa).appendTo(formGrp).addClass("form-control");
					var tavat = ['Autolla', 'Kävellen', 'Pyörällä', 'Julkinen liikenne'];
					for(var j = 0; j < tavat.length; j++) {
						var liikkumisTapaOpt = document.createElement('OPTION');
						$(liikkumisTapaOpt).appendTo(liikkumisTapa).val(j).text(tavat[j]);
					}

					var haeOhjeet = document.createElement('INPUT');
					haeOhjeet.setAttribute('type', 'button');
					$(haeOhjeet).appendTo(formGrp).addClass("btn btn-primary").val("Hae reittiohjeet");
					
					var tiedot = document.createElement('DIV');
					$(tiedot).appendTo(panel_body).addClass("scroll");

					$(haeOhjeet).click(function() {
						var liikkumisTapaFin;
						switch($(liikkumisTapa).val()) {
							case 0: liikkumisTapaFin = 'DRIVING'; break;
							case 1: liikkumisTapaFin = 'WALKING'; break;
							case 2: liikkumisTapaFin = 'BICYCLING'; break;
							case 3: liikkumisTapaFin = 'TRANSIT'; break;
							default: liikkumisTapaFin = 'DRIVING'; break;
						}

						haeReittitiedot($(lahtoOsoite).val(), osoite, liikkumisTapaFin, tiedot);
					});


					//Modaalin sulje-nappi
					$('.modaali.panel-footer .btn.btn-default').click(function(event) {
						piilotaModaali(event);
					});

				});
			})();
		}
	}

	/*
	----- KARTTA -----
	*/

	var kartta, geocoder, directionsService, directionsHandler;
	var markerArray = [];
	luoKartta();

	function luoKartta() {
		geocoder = new google.maps.Geocoder();
		directionsService = new google.maps.DirectionsService();
		directionsHandler = new google.maps.DirectionsRenderer();
		kartta = new google.maps.Map(document.getElementById('kartta'), {
			zoom: 12,
			center: {lat: 61.498048, lng: 23.764805}
		});
	}

	function geokoodaaMerkki(osoite) {
		geocoder.geocode({'address': osoite}, function(results, status) {

			if(status == 'OK') {
				var merkki = new google.maps.Marker({
					map: kartta,
					position: results[0].geometry.location
				});
				markerArray.push(merkki);
				if(markerArray.length == 1)
					kartta.setCenter(results[0].geometry.location);
			} else {
				console.log('Virhe. ' + status + ' ' + osoite);
			}
		});
	}
	function poistaMerkit() {
		for(var i = 0; i < markerArray.length; i++) {
			markerArray[i].setMap(null);
		}
		markerArray = [];
	}

	function haeReittitiedot(lahto, kohde, ltapa, tiedot) {
		$(tiedot).text("Ladataan reittitietoja...");

		directionsHandler.setPanel(tiedot);

		directionsService.route({
			origin: lahto,
			destination: kohde,
			travelMode: ltapa
		}, function(response, status) {
			if (status === 'OK') {
				$(tiedot).text("")
        	    directionsHandler.setDirections(response);
        	} else {
            	$(tiedot).text('Reittiohjeiden haku ei onnistunut. ' + status);
        	}
		});
	}
});