jQuery(document).ready(function($) {

    var annotations = (function() {
        if(window.localStorage) {
            var annotations = JSON.parse(localStorage.getItem("annotations"));

            return annotations;
        } else {
            return [];
        }
    })();

    var colors = [
        {
            className: "yellow",
        },

        {
            className: "green",
        },

        {
            className: "pink",
        },

        {
            className: "blue",
        },
    ]

    var annotator = Object.create(Annotator);
    annotator.init({
        containerElement: ".content",
        annotations: annotations,
        colors: colors
    });
    annotator.startListening();

});