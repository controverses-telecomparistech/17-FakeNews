/* TODO: mettre l'acteur sélectionné en surbrillance
   TODO: en cas de clic sur le header d'un groupe afficher les liens de tous ses acteurs
   Eventuellement, mettre en valeur les liens plutôt que n'afficher que ceux de
   l'acteur courant
*/


var w=600,
    h=600;

var svg = d3.select(".carteacteurs")
    .attr("width",w)
    .attr("height",h)
    .on("click", function(d) {
        d3.selectAll("line").attr("stroke-width",2);
    });

svg.append("rect").attr("width",w).attr("height",h).attr("fill","lightgray");

d3.queue().defer(d3.json, "data/acteurs/carte.json")
       .defer(d3.json, "data/acteurs/link.json")
       .awaitAll(main);

function main(err, foo) {
    if(err) return console.log(err);
    var data = foo[0];
    var links = foo[1];
    // Calcul de la largeur nécessaire
    var grpwidth = 50+getTextWidth(longestString(data),"10 px sans-serif");
    var maxnbactors = maxNbActors(data);
    var nbgroups = data.length;
    var nbgroupsincol = data.length/2;
    var rowheight = 20;
    /* Idée: partir du principe que tous les groupes font la même taille, qui est la hauteur max
       pour calculer hspace */
    var grpheight = maxnbactors*rowheight;
    var hspace=Math.floor((w-2*grpwidth)/(1+nbgroupsincol));
    var vspace=Math.floor((w-2*grpheight)/(1+nbgroupsincol));

    var groups = svg.selectAll("g")
        .data(data)
        .enter().append("g")
        .attr("x", function(d,i) {
            return hspace+((!(i%nbgroupsincol)) ? 0 : grpwidth+hspace);})
        .attr("y", function(d,i) {
            return y = vspace+Math.floor(i/nbgroupsincol)*(vspace+grpheight);})
        .attr("col", function(d,i) { return i/nbgroupsincol;})
        .attr("transform", function(d,i) {
            var x = hspace+((!(i%nbgroupsincol)) ? 0 : grpwidth+hspace),
                y = vspace+Math.floor(i/nbgroupsincol)*(vspace+grpheight);
            return "translate("+x+","+y+")";});

    var headers = groups.append("g").attr("class","header");
    headers.append("rect")
        .attr("width",grpwidth).attr("height",rowheight)
        .attr("fill","steelblue")
        .on("click", function(d) {
            document.getElementById("A").innerHTML = d.txt;
            var rects = d3.select(this.parentNode.parentNode).selectAll(".row").selectAll("rect").nodes();
            svg.selectAll("line").attr("stroke-width",2);
            for (var i = 0; i < rects.length; i++) {
                for (var j = 0; j < links.length; j++) {
                    if (rects[i].__data__.name == links[j].a || rects[i].__data__.name == links[j].b) {
                        console.dir(j);
                        svg.selectAll("line[nb="+"\""+j+"\""+"]").attr("stroke-width",4);
                    }
                }
            }
            d3.event.stopPropagation();
        });

    headers.append("text")
        .attr("x", grpwidth/2)
        .attr("dy","0.90em")
        .text(function(d) {return d.name});

    var rows = groups.selectAll("g.row")
        .data(function(d) { return d.actors; })
        .enter().append("g")
        .attr("class","row")
        .attr("transform", function(d,i) {
            var y = (i+1)*rowheight;
            return "translate(0,"+y+")";})

    rows.append("rect")
        .attr("width",grpwidth)
        .attr("height",rowheight)
        .attr("fill",function(d,i) { return (i%2) ? "steelblue":"lightsteelblue";})
        .attr("class",function(d) { return d.name;})
        .on("click", function(d,i) {
            document.getElementById("A").innerHTML = d.txt;
            svg.selectAll("line").attr("stroke-width",2);
            for (var i = 0; i < links.length; i++) {
                if (d.name == links[i].a || d.name == links[i].b)
                    svg.selectAll("line[nb="+"\""+i+"\""+"]").attr("stroke-width",4);
            }
            d3.event.stopPropagation();
        });

    rows.append("text")
        .attr("x",grpwidth/2)
        .attr("dy","0.90em")
        .attr("fill","white")
        .text(function(d) { return d.name;});
    
    for (var i = 0; i < links.length; i++) {
        var link1 = links[i].a;
        var link2 = links[i].b;
        console.dir(links[i]);
        var rect1 = d3.select("."+link1).node();
        var rect2 = d3.select("."+link2).node();
        var coords = findCoords(rect1);
        var othercoords = findCoords(rect2);
        svg.append("line")
            .attr("x1", coords[0])
            .attr("y1", coords[1])
            .attr("x2", othercoords[0])
            .attr("y2", othercoords[1])
            .attr("stroke-width",2)
            .attr("stroke","green")
            .attr("nb", i)
            .attr("txt", links[i].txt)
            .on("click", function(d) {
                document.getElementById("A").innerHTML = d3.select(this).attr("txt");
                d3.event.stopPropagation();
            });
    }

        // Affichage de tous les liens
        function getTextWidth(text, font) {
            // re-use canvas object for better performance
            var canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
            var context = canvas.getContext("2d");
            context.font = font;
            var metrics = context.measureText(text);
            return metrics.width;
        }

        // data est un array de {name, actors:[]}
        function longestString(data) {
            var max = "";
            for (var i = 0; i < data.length; i++) {
                max = (data[i].name.length > max.length) ? data[i].name : max;
                for (var j = 0; j < data[i].actors.length; j++) {
                    max = (data[i].actors[j].name.length > max.length)
                        ? data[i].actors[j].name : max;
                }
            }
            return max;
        }

        function maxNbActors(data) {
            var max = 0;
            for (var i = 0; i < data.length; i++) {
                max = Math.max(data[i].actors.length,max);
            }
            return max;
        }

        // findCoords attend un rect, correspondant à un acteur
        function findCoords(foo) {
            var group = foo.parentNode.parentNode;
            var i = 0;
            for (var j = 0; j < group.__data__.actors.length; j++) {
                if (group.__data__.actors[i].name == foo.__data__.name) {
                    break;
                }
                i++;
            }
            // Déterminer la transform()
            var transform = group.attributes[3].value;
            var coords = transform.match(/\d+/g);  
            var x = parseInt(coords[0]);
            var y = parseInt(coords[1]);
            y += (1.5+i)*rowheight;
            x += (group.attributes.col.value == "0") ? grpwidth : 0;
            return [x,y];
        }
}
