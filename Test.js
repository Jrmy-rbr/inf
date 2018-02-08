// Test.js
// (c) 2007 B. Crowell and M. Khafateh, GPL 2 license
//
// This file provides a constructor, com.lightandmatter.Test.
// To run these tests, invoke the calculator with a URL ending in ?test, or just click on the link at the bottom of the page.
//
// to do:
//   fix the ones that actually fail
//   After implementing lc_series operator, use it in tests to make sure specific coefficients of series expansions come out right.

var com;
if (!com) {com = {};}
if (!com.lightandmatter) {com.lightandmatter = {};}

com.lightandmatter.Test =
  function (output_element,lexer,parser) {
      // testing input
      var testing_lines = [
                       // In the following, we can have:
                       //    [string,native] ... test that computing string gives an output that's equal to the native javascript typpe (number or boolean)
                       //    [string,string] ... test that the two strings evaluate to the same result
                       //    [string] ... test that the computation doesn't result in null or undefined
                       //    [string,null] ... tests that the computation does result in null or NaN
                       //    [] ... do nothing (placeholder for end of list, to avoid forgetting commas)
                       // The tolerance for comparisons is set by an optional third argument, eps.
                       // The magnitude of the difference between the results should be no more than eps.
                       // Eps defaults to 10^-12.
                       ["2+2",4],
                       ["1<3",true],
                       ["1>3",false],
                       ["2d",null],
                       ["1+d"],
                       ["1/d"],
                       ["d+d","2*d"],
                       ["d<0",false],
                       ["d<-1",false],
                       ["-d>-1",true],
                       ["d<10^-10",true],
                       ["d^2<d",true],
                       ["sqrt d > d",true],
                       ["2*d>d",true],
                       ["a=6*7;a+5",47],       // semicolon operator and side-effects
                       ["zzz=1;zzz==1",true],   // nopromote flag
                       ["f x=x^2;f(f(2))",16], // composition of functions
                       ["sqrt(-1)","i"],
                       ["2^(1/2)","1.414",0.001],
                       ["sqrt(-d)","i*sqrt(d)"], // bug reported feb 2018
                       ["((1+i)/(sqrt 2))^8",1],
                       ["(1,2,3)==(1,2,3)",true],
                       ["(1,2,3)==(1,2,4)",false],
                       ["((1,2),(3,4))==((1,2),(3,4))",true],
                       ["((1,2),3)==(1,2,3)",false], // closed_array, parens have extra significance beyond grouping in the case of arrays
                       ["array[1/(1-d)]==[[0,1],[1,1],[2,1],[3,1],[4,1]]",true],
                       ["array(exp(d))==[[0,1],[1,1],[2,0.5],[3,0.16666666666666666],[4,0.041666666666666664]]",true],
                       ["array cos sin cos sin d==[[0,0.6663669686453381],[2,0.20143030141979187],[4,-0.029816455545224607],[6,-0.05417070055498075],[8,0.047167710820525295]]",true],
                       ["(1+d)^pi"],
                       ["d^pi",null],
                       ["[sqrt(d+d^2)]^2","d+d^2"],
                       ["d/0",null],
                       ["i/0",null],
                       ["exp(ln(1+d))","1+d"],
                       ["array(2^d)==[[0,1],[1,0.6931471805599453],[2,0.24022650695910075],[3,0.05550410866482159],[4,0.009618129107628489]]",true],
                       ["2^(1/d)",null],
                       ["array[(1+d)^(1/d)]==[[0,2.7182815255731914],[1,-1.359139384920635],[2,1.2458746693121687],[3,-1.1892381779100527],[4,1.1547785769400352]]",true],
                       // "foo",
                       // "2d",  // the parser doesn't return anything for this line
                       [] // end of list
                       ];

      function html_armor(s) {
        if (typeof(s)!=='string') {return s;}
        return s.replace(new RegExp('<',"g"),'&lt;');
      }

      function unstring_if_possible(s) {
        if (typeof(s)!=='string') {return s;}
        if (s=='0') {return 0;} // In some browsers, parseFloat() returns 0 on error, so eliminate that case.
        // parseFloat ignores trailing stuff that it can't parse, so check for that:
        if (s.match(/[di\(\)]/)) {return s;}
        var n = parseFloat(s);
        if (n===0 || isNaN(n)) {n= s;}
        return n;
      }
  
      function do_parse(lexer,parser,line) {
          lexer.change_text(line);
          parser.parse(lexer.tokens,lexer.props);
          
          var result = "";
          var parser_errors = "";
          try {
            //result = parser.toString();
            result = parser.tree_to_string(parser.tree);
          }
          catch (e) {
            parser_errors += e;
          }
          return [result,parser_errors];

      }

      // this variable hold the input and output for the whole session.
      // I tried to make it work like the private variable "terminal" in Terminal.js
      // whatever is in debug2 will be overwritten. It could easily be changed to append 
      // results to the debug2 div.
      var testing_output = "";
      var nn =  com.lightandmatter.Num;

      var n_passed = 0;
      var n_tried = 0;
      for (var i in testing_lines) {
        test = testing_lines[i];
        if (test.length>0) {
          n_tried += 1;
          line = test[0];

          var x,y,rx,ry;
          x = do_parse(lexer,parser,line);
          rx = x[0];
          rx = unstring_if_possible(rx);
          var parser_errors = x[1];
          var unequal = false;
          var diff;
          ry = null;

          if (test.length>=2) { // comparing against a second expression
            var eps = 1e-12; // tolerance for comparisons, see explanation above
            if (test.length>=3) {eps=test[2];}
            if (typeof(test[1])=='string') {
              y = do_parse(lexer,parser,test[1]);
              ry = y[0];
              parser_errors += y[1];
              ry = unstring_if_possible(ry);
              if (typeof(rx)=='string' || typeof(ry)=='string') {
                unequal = rx.toString() != ry.toString();
              }
              else {
                diff = com.lightandmatter.Num.binop('-',rx,ry);
                //document.getElementById("debug").innerHTML += 'diff='+diff+nn.num_type(diff);
                if (diff===null) {
                  unequal=true;
                }
                else {
                  if (typeof(diff)=='number') {diff=Math.abs(diff);} else {diff=diff.abs();}
                  unequal = nn.binop('>',diff,eps);
                }
              }
            }
            if (test[1]===null) {
              //unequal = rx!==null && !(typeof(rx)=='number' && isNaN(rx));
              unequal = rx!==null && !nn.is_invalid(rx);
            }
            if (typeof(test[1])=='boolean') {
              unequal = (rx!=test[1]);
            }
            if (typeof(test[1])=='number') {
              ry = test[1];
              if (typeof(test[1])=='number') {
                if (rx!==null && ry!==null) {
                  diff = com.lightandmatter.Num.binop('-',rx,ry);
                  if (typeof(diff)=='number') {diff=Math.abs(diff);} else {diff=diff.abs();}
                  unequal = nn.binop('>',diff,eps);
                }
                else {
                  unequal = true;
                }
              }
            }
          }

          // TODO - add style
          testing_output += "testing " + html_armor(line);
          if (test.length>=2) {testing_output += ' = '+html_armor(test[1]);}
          if (unequal) {
            testing_output += "<br/>Unequal expressions, "+rx+" and "+ry+", types "+
                               typeof(rx)+','+typeof(ry)+
                               "**************** fail *******************<br/>";
          }
          else {
            testing_output += '...pass -- ';
            n_passed += 1;
          }
          //testing_output += "<br/>";
          if (parser_errors) {
            testing_output += "Parser Exception: " + parser_errors + "<br/>";
          }
          testing_output += rx;
          if (test.length>=2 && typeof(test[1])!='boolean') {testing_output += ' = '+ry;}
          testing_output += "<br/>";
          output_element.innerHTML = testing_output;
        }
      }
      return [n_passed,n_tried];

    
  };
