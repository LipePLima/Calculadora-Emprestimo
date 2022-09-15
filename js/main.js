"use strict";

function calculate() {
    // pesquisa os elementos de entrada e saída no documento.
    var amount = document.getElementById("amount");
    var apr = document.getElementById("apr");
    var years = document.getElementById("years");
    var zipcode = document.getElementById("zipcode");
    var payment = document.getElementById("payment");
    var total = document.getElementById("total");
    var totalinterest = document.getElementById("totalinterest");

    // Obtém a entrada do usuário através dos elementos de entrada. Presume que tudo isso é válido.
    var principal = parseFloat(amount.value);
    var interest = parseFloat(apr.value) / 100 /12;
    var payments = parseFloat(years.value) * 12;

    // Agora calcula o valor do pagamento mensal.
    var x = Math.pow(1 + interest, payments);
    var monthly = (principal * x * interest)/(x-1);

    // Se o resultado é um número finito, a entrada do usuário estava correta e temos resultados.
    if (isFinite(monthly)) {
        payment.innerHTML = monthly.toFixed(2);
        total.innerHTML = (monthly * payments).toFixed(2);
        totalinterest.innerHTML = ((monthly*payments)-principal).toFixed(2);
        
        // salva a entrada do usuário para recuperá-la na próxima vez que ele entrar.
        

        // Anúncio: localiza e exibe financeiras locais, mas ignora erros de rede.

        try { // Captura qualquer erro que ocorrer dentro das chaves.
            getLender(amount.value, apr.value, years.value, zipcode.value);
        }
        catch(e) {/* E ignora esses erros */}

        // Traça o gráfico do saldo devedor, dos juros e dos pagamentos do capital.
        chart(principal, interest, monthly, payments);
    }
    else {
        // O resultado foi Not-a-Number ou infinito, o que significa que a entrada estava incompleta ou era inválida. apaga qualquer saída exibida anteriormente.
        total.innerHTML = ""
        totalinterest.innerHTML = ""
        chart();  // Sem argumentos, apaga o gráfico.
    }
}

// Salva a entrada do usuário como propriedades do objeto localSorage.
function sabe(amount, apr, years, zipcode) { // Só faz isso se o navegador suportar.
    if (window.localStorage) {
        localStorage.loan_amount = amount;
        localStorage.loan_apr = apr;
        localStorage.loan_years = years;
        localStorage.loan_zipcode = zipcode;
    }
}

// Tenta restaurar os campos de entrada automaticamente quando o documento é carregado pela primeira vez.
window.onload = function() {
    // Se o navegador suporta localStorage e temos alguns dados armazenados
    if (window.localStorage && localStorage.loan_amount) {
        document.getElementById('Amount').value = localStorage.loan_amount;
        document.getElementById("apr").value = localStorage.loan_apr;
        document.getElementById("zipcode").value = localSrotage.loan_zipcode;
    }
};

// Passar a entrada do usuário para um script no lado do servidor que (teoricamente) pode retornar uma lista de links para financeiras locais.
// Exemplo não contém uma implementação real desse serviço de busca. Mas se o serviço existisse, essa função funcionaria com ele.
function getLender(amount, apr, years, zipcode) {
    // Se o navegador não suportar o objeto XMLHttpRequest, não faz nada.
    if (!window.XMLHttpRequest) return;
    // Localiza o elemento para exibir a lista de financeiras.
    var ad = document.getElementById("lenders");
    if (!ad) return; // Encerra se não há ponto de saída.
    // Codifica a entrada do usuário como parâmetros de consulta em um URL.
    var url = "getLender.php" + 
    "?amt=" + encodeURIComponent(amount) +
    "&apr=" + encodeURIComponent(apr) + 
    "&yrs=" + encodeURIComponent(years) + 
    "&zip=" + encodeURIComponent(zipcode);

    

    // Antes de retornar, registar uma função de rotina de tratamento de evento que será chamada em um momento posterior
    req.onreadystatechange = function() {
        if (req.readyState == 4 && req.status == 200) {
            // Se chegamos até aqui, obtivemos uma resposta HTTP válida e completa
            var response = req.responseText;
            var lenders = JSON.parse(response);

            // Converte o array de objetos lender em uma string HTML
            var list = "";
            for(var i = 0; i < lenders.length; i++) {
                list += "<li><a href=' " + lenders[i].url + "'>" +
                lenders[i].name + "</a>";
            }

            // Exibe o código HTML no elemento acima.
            ad.innerHTML = "<ul>" + list + "</ul>";
        }
    }
}

// Gráfico do saldo devedor mensal, dos juros e do capital em um elemento <canva> da HTML.
function chart(principal, interest, monthly, payments) {
    var graph = document.getElementById("graph");
    graph.width = graph.width;

    // Se chamamos sem argumentos ou se esse navegador não suporta.
    if (arguments.length == 0 || !graph.getContext) return;

    // Obrtém o objeto "contexto" de <canvas> que define a API de desenho
    var g = graph.getContext("2d");
    var width = graph.width, height = graph.height;

    // Essas funções convertem números de pagamento e valores monetários em pixels
    function paymentToX(n) { 
        return n * width/payments; 
    }
    function amountToY(a) {
        return height-(a * height/(monthly*payments*1.05));
    }

    // Os pagamentos são uma linha reta de (0, 0) a (payments, monthly*payments)
    g.moveTo(paymentToX(payments), amountToY(monthly*payments));
    g.lineTo(paymentToX(payments), amountToY(0));
    g.closePath();
    g.fillStyle = "#f88";
    g.fill();
    g.font = "bold 12px sans-serif";
    g.fillText("Pagamentos totais de juros", 20,20);

    // O capital acumulado não é linear e é mais complicado de representar no gráfico
    var equity = 0;
    g.beginPath();
    g.moveTo(paymentToX(0), amountToY(0));

    for(var p = 1; p <= payments; p++) {
        // Para cada pagamento, descobre quanto é o juro
        var thisMonthsInterest = (principal-equity)*interest;
        equity += (monthly - thisMonthsInterest);
        g.lineTo(paymentToX(p), amountToY(equity));
    }

    g.lineTo(paymentToX(payments), amountToY(0));
    g.closePath();
    g.fillStyle = "green";
    g.fill();
    g.fillText("Patrimônio Total", 20, 35);

    // Faz laço novamente, com acima, mas representa o saldo devedor como uma linha preta grossa no gráfico.
    var bal = principal;
    g.beginPath();
    g.moveTo(paymentToX(0), amountToY(bal));
    for(var p = 1; p <= payments; p++) {
        var thisMonthsInterest = bal*interest;
        bal -= (monthly - thisMonthsInterest);
        g.lineTo(paymentToX(p), amountToY(bal));
    }
    g.linewidth = 3;
    g.stroke();
    g.fillStyle = "black";
    g.fillText("Saldo do empréstimo", 20,50);

    // Agora faz marcações anuais e os números de ano no eixo X 
    g.textAlign="center";

    var y = amountToY(0);
    for(var year=1; year*12 <= payments; year++) {
        var x = paymentToX(year*12);
        g.fillRect(x-0.5, y-3,1,3);
        if (year == 1) g.fillText("Year", x, y-5) 
            if (year % 4 == 0 && year*12 !== payments) 
                g.fillText(String(year), x, y-5);  
    }

    // Marca vetores de pagamento ao longo da margem direita
    g.textAlign = "right";
    g.textBaseline = "middle";
    var ticks = [monthly*payments, principal];
    var rightEdge = paymentToX(payments);
    for(var i = 0; i < ticks.length; i++) {
        var y = amountToY(payments);
        g.fillRect(rightEdge-3, y-0.5, 3,1);
        g.fillText(String(ticks[i].toFixed(0)), rightEdge-5, y);
    }
}
