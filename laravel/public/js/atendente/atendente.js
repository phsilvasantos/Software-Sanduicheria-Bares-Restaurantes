	//Adicionado em: 26/01/2016
	var numeroMesa = null;	//variável que armazenará a mesa selecionada (para adicionar um pedido)
	var produtos = [];		//array que armazenará os ids dos produtos 
	var idConta = null;	//variável que armazenará o número da conta relacionado ao número da mesa
	var nomeFuncionario = null;	
	var idCliente = null;
	var arrayProdutosAlterados = [];		//variável que contém objetos de produtos que tiveram seus itens modificados
	var contadorProdutosSelecionados = 0;
	//variáveis que representam jquery
	var divCadaItem = $(".divCadaItem");
	var tituloCategoria = $(".tituloCategoria");

	//clicar automaticamente na primeira mesa ao inicializar a página
	$(document).ready(
		function() {
			$("#1").click();
			$('#telefone').mask('(00) 00000-0000');
			$('#novoTelefone').mask('(00) 00000-0000');

			//desabilita inicialmente os itens
			desabilitarItens();
		}
	);

	/* desabilita todos os itens (o usuário não consegue clicar em nenhum) */
	function desabilitarItens() {
		divCadaItem.removeClass('enabledbutton');
		divCadaItem.addClass('disabledbutton');
		tituloCategoria.removeClass('enabledbutton');
		tituloCategoria.addClass('disabledbutton');
		$("#mensagemAlerta").css('display', 'initial');
	}

	function habilitarItens() {
		divCadaItem.removeClass('disabledButton');
		divCadaItem.addClass('enabledbutton');
		tituloCategoria.removeClass('disabledbutton');
		tituloCategoria.addClass('enabledbutton');
		$("#mensagemAlerta").css('display', 'none');
	}

	//caso o usuario aperte ESC, cancelar todos os produtos selecionados
	$(document).keyup(function(e) {
		if (e.keyCode === 27) {
			desselecionarProdutos();
		}
	});

	//caso o usuario aperte ENTER, adicionar todos os produtos selecionados
	$("#telefone").keypress(function(e) {
		if (e.keyCode === 13) {
			pesquisarCliente();
		}
	});

	$("#txtFiltrar").keypress(function(e) {
		if (e.keyCode === 13) {
			filtrarCliente();
		}
	});


	function abrirConta() {
		//verifica se ao menos um cliente foi selecionado
		var nome = $("#nome").val();

		if (nome == "") {
			alert('Você precisa primeiramente buscar um cliente.');
		} else {
			//busca o id do cliente
			var idCliente = $("#idCliente").val().trim();

			var json = {'idCliente': idCliente};

			//cria uma nova conta e busca o ID desta conta
			$.get('/criarNovaContaCliente', json, function(data) {
				/* data = id da nova conta */
				//armazena o ID da conta em algum lugar
				$("#idConta").val(data);
				
				//função responsável por fazer a troca de divs
				removerDivPesquisarCliente();
			});
			habilitarItens();
		}	
	}

	function zerarFormulario() {
		$("#telefone").val("(62)");
		$("#nome").val("");
		$("#cep").val("");
		$("#endereco").val("");
		$("#idConta").val("");
	}

	function removerDivPesquisarCliente() {
		var nome = $("#nome").val();
		var telefone = $("#telefone").val();
		var id = $("#idCliente").val();

		/* apaga a parte que permite o usuário procurar novo cliente */
		$("#dadosClientePesquisado").css('display', 'none');
		$("#btnAdicionarCliente").css('display', 'none');
		$("#dadosCliente").css('display', 'none');
		$("#ContasAbertas").css('display', 'initial');

		/* mostra os dados do cliente selecionado */
		$("#dadosClienteSelecionado").css('display', 'initial');
		$("#nomeClienteSelecionado").html(nome);
		$("#telClienteSelecionado").html(telefone);
		$("#idClienteSelecionado").html(id);
	}

	function escolherOutroCliente() {
		zerarFormulario();
		
		/* volta ao normal as configurações iniciais */
		$("#dadosClientePesquisado").css('display', 'initial');
		$("#btnAdicionarCliente").css('display', 'initial');
		$("#dadosCliente").css('display', 'initial');
		$("#ContasAbertas").css('display', 'none');

		/* zera os dados do cliente selecionado */
		$("#dadosClienteSelecionado").css('display', 'none');
		$("#nomeClienteSelecionado").html("");
		$("#telClienteSelecionado").html("");
		$("#idClienteSelecionado").html("");

		$("#telefone").focus();

		desabilitarItens();
	}


	function filtrarCliente() {
		var filtro = $("#txtFiltrar").val();
		var filtrarPor = $("#selectFiltrar").find(':selected').val();

		if (filtro != "") {
			var json = {
				'filtro': filtro,
				'filtrarPor': filtrarPor
			};

			$.get('/filtrarCliente', json, function(data) {
				$("#bodyTabelaClientes").empty();
				
				data.forEach(function(item) {
					$("#bodyTabelaClientes").append(
						"<tr><td style = 'text-align: center'>" + item.nome 
						+ "</td> <td style = 'text-align: center'> " + item.telefone 
						+ "</td> <td style = 'text-align: center'> " + item.cep
						+ "</td> <td style = 'text-align: center'>" + item.endereco 
						+ "</td> <td style = 'text-align: center'>"
						+"<button class = 'btn btn-default glyphicon glyphicon-edit' style = 'width: 50px; display: inline-block' onclick='abrirModalEditarCliente(\"" + encodeURIComponent(JSON.stringify(item)) + "\")'></button>"
						+"&nbsp;&nbsp;<button class = 'btn btn-danger glyphicon glyphicon-trash' onclick='excluirCliente("+item.id+");' style = 'width: 50px; display: inline-block'></button></td>"
						+ "<td style = 'text-align: center'><button class = 'btn btn-success btnSelecionarCliente' style = 'display: inline-block' onclick='selecionarCliente(\"" + encodeURIComponent(JSON.stringify(item)) + "\");'>Selecionar</button></td></tr>");
				});

			});
		} else {
			$("#bodyTabelaClientes").empty();
		}
	}


	function excluirCliente(id) {
		if (confirm("Deseja realmente excluir este registro?")) {
			var json = {"idCliente": id};

			$.get('/excluirCliente', json, function(data) {
				//refresh na tabela
				alert("Registro excluído com sucesso!");
				$("#btnFiltrarCliente").click();
			});
		} 
	}


	function abrirModalCadastrarClientes() {
		$("#modalNovoCliente").modal('toggle');
	}


	function abrirModalListarClientes() {
		$("#modalListarClientes").modal('toggle');
	}


	function selecionarCliente(cliente) {
		var json = JSON.parse(decodeURIComponent(cliente));
		
<<<<<<< HEAD
		//seleciona o novo cliente cadastrado
		$("#idCliente").val(item.id);
		$("#telefone").val(item.telefone);
		$("#endereco").val(item.endereco);
		$("#nome").val(item.nome);
		$("#cep").val(item.cep);
		window.location = ("atendente/googlemaps?id=" + item.id + "&cep=" + item.cep);
	}
=======
>>>>>>> 1a35c433e46a2aed0e60a25c63ac20b057216d6a

		$.get('/atendente/etapa2', json, function(data) {
			console.log(data);
		});

<<<<<<< HEAD
=======
	}
>>>>>>> 1a35c433e46a2aed0e60a25c63ac20b057216d6a


	function cadastrarNovoCliente() {
		console.log(document.forms);
		var telefone = (document.forms[2].novoTelefone.value);
		var nome = document.forms[2].novoNome.value;
		var endereco = document.forms[2].novoEndereco.value;
		var cep = document.forms[2].novoCep.value;

		var json = {
			'telefone': telefone,
			'nome': nome,
			'endereco': endereco,
			'cep': cep
		};

		$.get('/cadastrarNovoCliente', json, function(id) {
			//imprime msg ok ou erro ao cadastrar cliente
			alert("Cadastrado com sucesso!");
			
			//seleciona o novo cliente cadastrado
			$("#idCliente").val(id);
			$("#endereco").val($("#novoEndereco").val());
			$("#nome").val($("#novoNome").val());
			$("#cep").val($("#novoCep").val());

			//fecha o modal
			$("#modalNovoCliente").modal('toggle');
		});
	}


	function abrirModalEditarCliente(item) {
		var item = JSON.parse(decodeURIComponent(item));
		
		//fecha o modal atual pois não pode ter dois modais juntos
		$("#modalListarClientes").modal('toggle');
		$("#modalEditarClientes").modal('toggle');

		//passa os dados da tabela para o form
		$("#idClienteEdit").val(item.id);
		$("#telefoneEdit").val(item.telefone);
		$("#enderecoEdit").val(item.endereco);
		$("#nomeEdit").val(item.nome);
		$("#cepEdit").val(item.cep);
	}

	function editarCliente() {
		var telefone = $("#telefoneEdit").val();
		var endereco = $("#enderecoEdit").val();
		var nome = $("#nomeEdit").val();
		var cep = $("#cepEdit").val();
		var idCliente = $("#idClienteEdit").val();

		var json = {
			'telefone': telefone,
			'nome': nome,
			'idCliente': idCliente,
			'endereco': endereco,
			'cep': cep
		};

		$.get('/editarCliente', json, function(id) {
			//imprime msg ok ou erro ao cadastrar cliente
			alert("Alterado com sucesso!");
			//fecha o modal
			$("#modalEditarClientes").modal('toggle');
			abrirModalListarClientes();
			$("#btnFiltrarCliente").click();
		});
	}

	//pesquisa rapida
	function pesquisarCliente() {
		var telefone = (document.forms[0].telefone.value);
		
		var json = {
			'telefone': telefone
		};

		//faz a requisição get e preenche os valores
		$.get('/pesquisarCliente', json , function(data) {
			
			//verifica se o cliente já foi cadastrado ou não
			if (data.length == 0) {
				alert('Cliente não cadastrado.');
			} else if (data.length == 1) {	
				data = data[0];
				//caso só encontre um registro, preencher os dados e escolher o funcionário
				$("#idCliente").val(data.id);
				$("#endereco").val(data.endereco);
				$("#nome").val(data.nome);
				$("#cep").val(data.cep);
			} else {
				abrirModalListarClientes();		//abre o modal
				$("#txtFiltrar").val(telefone);	//insere o texto de filtro
				filtrarCliente();				//força uma filtragem
			}	
		});

	}

	//adicionado em: 28/01/2016
	//assim que clicar em um ítem, altera a sua borda e coloca em um array o id do item 
	$('.divCadaItem').click(
		function() {

			//verifica qual é o estado atual do item que foi clicado (já foi selecionado ou não?)
			var clicked = $(this).attr("data-clicked");

			//busca qual é o estado da borda do item que foi clicado
			var borda = $(this).css("border");

			//busca o ID do ítem clicado
			var id = $(this).attr('val');

			//caso eu esteja selecionando um novo item (pintar a borda e colocar o id do item no array)
			if (clicked == 0) {		
				$(this).css("border", "3px solid blue");	//adiciona a borda no ítem
				$(this).css("box-shadow", "0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)");	//adiciona sombra
				
				produtos.push(id);		//adiciona o ítem no array
				
				
				contadorProdutosSelecionados++; 	//adiciona um produto do contador
				$("#contadorProdutosSelecionados").css("display", "initial");

				$(this).attr("data-clicked", 1);

				if (contadorProdutosSelecionados == 0)	{     //caso nenhum produto esteja selecionado
					$("#contadorProdutosSelecionados").html("");	//desaparecer com o texto
					$("#desselecionarProdutos").css("display", ""); //desaparecer com o ícone de desselecionar 
				}

				else if (contadorProdutosSelecionados == 1) {	//caso apenas um produto esteja selecionado
					$("#contadorProdutosSelecionados").html(
						contadorProdutosSelecionados + " produto selecionado" //atualizar o texto no singular
					);
					$("#desselecionarProdutos").css("display", "initial");	
				}
				else {					
					$("#contadorProdutosSelecionados").html(
						contadorProdutosSelecionados + " produtos selecionados" //atualizar o texto no plural
					);
					$("#desselecionarProdutos").css("display", "initial");
				} 
			

			//caso o item esteja sendo deselecionado
			} else {
				
				$(this).css("border", "0px none rgb(51, 51, 51)");	//retira a borda
				$(this).css("box-shadow", "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)");	//retira a sombra

				var index = produtos.indexOf(id);		//encontra o índice deste item no array
				
				//remove o botão de detalhes
				$(this).next("[name='btnDetalhes']").remove();

				//remove o ítem do array
				if (index > -1)
					produtos.splice(index, 1);		
				
				$(this).attr("data-clicked", 0);

				//adicionado em: 27/7
				//contador de produtos selecionados
				contadorProdutosSelecionados--;		//retira um produto do contador
				if (contadorProdutosSelecionados == 0) {	//caso nenhum produto esteja selecionado
					$("#contadorProdutosSelecionados").html("");	//desaparecer com o texto
					$("#desselecionarProdutos").css("display", "none"); //desaparecer com o ícone de desselecionar 
				}
				else if (contadorProdutosSelecionados == 1)	{//caso apenas um produto esteja selecionado
					$("#contadorProdutosSelecionados").html(contadorProdutosSelecionados + " produto selecionado");	//atualizar o texto no singular
					$("#desselecionarProdutos").css("display", "initial");
				}
				else {				
					$("#contadorProdutosSelecionados").html(contadorProdutosSelecionados + " produtos selecionados"); //atualizar o texto no plural
					$("#desselecionarProdutos").css("display", "initial");
				}
			}
			
		}
	);

	//utilizada em .numeros.click
	function atualizarTabela() { //data = vetor que vem do banco de dados, com todos os produtos relacionados a esta conta
		
		var idConta = $("#idConta").val();
		var json = {
			'idConta': idConta
		};

		$.get('/buscarProdutos', json, function(data) {
			var totalConta = 0;	//contador para verificar quanto é o total da conta
			var contadorQuantidade = 0;	//conta quantos produtos existem no total

			console.log(data);

			//remove as linhas da tabela 
			$("#tabela tr").remove();		//evita que os produtos de uma mesa sejam colocados na mesma tabela que outra

			data.forEach(function(entry) {		//percorre cada produto
				var idContaProdutos = entry['id'];
				var idConta = entry['conta_id'];
				var nomeProduto = entry['nome'];
				var idProduto = entry['produto_id'];
				var preco = entry['precoFinal'];
				var quantidade = parseInt(entry['quantidade']);
				contadorQuantidade += quantidade;
				var totalProduto = preco * quantidade;
				$("#tabela").append(					//adiciona uma linha na tabela para cada produto
					"<tr><td width = '40%' style = 'text-align: center'>" 
					+ nomeProduto 
					+ "</td><td width = '15%' style = 'text-align: center'>R$ " 
					+ preco.toFixed(2) 
					+ "</td><td width = '15%' style = 'text-align: center'>"
				    + quantidade 
				    + "</td><td width = '20%' style = 'text-align: center; font-weight: bold;'> R$ " 
				    + totalProduto.toFixed(2) 
				    +"</td><td width = '30%' style = 'text-align: center'><button class = 'btn btn-danger' data-idConta = '" 
				    + idConta +"' id = '"+ idContaProdutos 
				    +"' onclick = 'cancelarProduto(this.id, this.getAttribute(\"data-idConta\"))'>Cancelar</button></td></tr>"
				);

				totalConta += totalProduto;
			});

			//adiciona a linha 'total'
			$("#tabela").append("<tr><td style = 'text-align: center; font-weight: bold; font-size: 20px'>Total</td><td></td><td style = 'text-align: center; font-weight: bold;'>" + contadorQuantidade +"</td><td style = 'text-align: center; font-weight: bold; font-size: 20px'> R$ " + totalConta.toFixed(2) + "</td></tr>");
		});
	}


	//qual funcao usa essa funcao? .numeros.click
	function atualizarTabelaComDetalhes(data) { 
	//data = vetor que vem do banco de dados, com 	todos os produtos relacionados a esta conta

		//remove as linhas da tabela 
		$("#tabelaDetalhes tbody tr").remove();		//evita que os produtos de uma mesa sejam colocados na mesma tabela que outra

		//contador para cada linha adicionada (para aumentar a propriedade HEIGHT do modal)
		var contador = 0;

		data.forEach(function(entry) {		//percorre cada produto
			var idConta = entry['conta_id'];
			var nomeProduto = entry['nome'];
			var preco = entry['precoFinal'];
			var horario = entry['created_at'];

			$("#bodyTabelaDetalhes").append(					//adiciona uma linha na tabela para cada produto
				"<tr><td width = '15%' style = 'text-align: center'>" + horario.substr(11, horario.length) + "</td><td width = '45%' style = 'text-align: center'>" + nomeProduto + "</td><td width = '30%' style = 'text-align: center'> R$ " + preco.toFixed(2) + "</td></tr>"
			);
			contador++;
		});

		//aumenta o tamanho da altura do modal
		var tamanhoInicial = 150;
		$(".modal-body").height(tamanhoInicial + contador*40);
	}

	//cancela um produto de uma determinada conta
	//idContasProdutos = id da relacao entre contas e produtos
	//o id da conta eh necessario por causa do funcionario
	function cancelarProduto(idContasProdutos, idConta) {
		var senha = prompt("Digite a sua senha para poder cancelar o pedido:");

			if (senha == "123123") {
				var json = {
					'idConta': idConta,
					'idContasProdutos': idContasProdutos
				};

				$.get('cancelarProduto', json, function() {
					atualizarTabela();
				});

			} else if (senha != null) {
				alert("Pedido NÃO cancelado! Senha inválida!");
			}
		
	}


	//adicionado em: 03/03/2016
	//irá encerrar uma determinada conta. Busca o ID da conta na div oculta 'idConta'
	$("#btnEncerrar").click(function() {
			//verifica se realmente deseja encerrar a conta
		if (confirm("Deseja realmente encerrar esta conta?") == true) {
			var idConta = $('#idConta').val();		//busca o id da conta
			
			//cria um objeto json para passar para a rota
			var json = {
				'id': idConta
			};


			//faz uma requisição para a rota alterar o valor de 'encerrada' para true
			$.get('encerrarConta', json, function(data) {
				alert('Conta encerrada!');
				atualizar();

			});
		}
	
	});

	

	//ao clicar em 'detalhes', e após decidir a quantidade de cada produto, o usuário clica em adicionar
	function adicionarItensAoPedido(obj) {
		//o que a função deve fazer?
		/*
			1) Pegar o valor total do pedido e substituir o valor antigo do produto por este valor
			2) Fechar o modal
			3) Selecionar o item 
		*/
		//pega o preço atualizado
		var precoString = $(".preco").html();
		var precoString = precoString.substr(2, precoString.length);
		var precoFloat = parseFloat(precoString).toFixed(2);

		//fecha o modal
		$("#modalDetalhesPedidoSanduiches").modal('toggle');
		
		//pego sempre o id do último item que foi adicionado (o id do item atual)
		//obs: o array produtos é preenchido sempre que se clica em um elemento ('.divCadaItem.click')
		var idAtual = produtos[produtos.length - 1];
		//adicionamos a um array de produtos que tiveram seus valores alterados
		var obj = {
			"id": idAtual,
			"preco": precoFloat
		}
		arrayProdutosAlterados.push(obj);

	}

	//ao clicar no botão verde 'adicionar produtos'
	function adicionarProdutos() {
		//verifica se pelo menos uma mesa foi escolhida
			
			var idConta = $("#idConta").val();

			//verifica se pelo menos um produto foi escolhido
			if (produtos.length == 0) {
				alert("Escolha pelo menos um produto antes de adicionar um pedido!");

			} else {

				//verifica se foi adicionado algum item a algum produto. Em caso positivo, devemos alterar o valor do preço do item
				if (arrayProdutosAlterados.length != 0) {
					var json = {
						"idConta": idConta,
						"produtos": produtos,
						"produtosAlterados": arrayProdutosAlterados
					};

					//temos que fazer a requisição get, mas temos também agora o preço de venda, que não é o do banco!
					//e sim o preço alterado conforme os itens adicionados
					//este preço está na arrayProdutosAlterados
					$.get('addPedidoComItens/', json, function(data) {
						atualizarTabela();
						desselecionarProdutos();
					});

				} else {
					
					//criar um objeto json com o id da conta e os ids dos produtos 
					var json = {
						"idConta": idConta,
						"produtos": produtos 
					};

					//tudo certo, podemos adicionar os pedidos no banco
					//realiza uma requisição ajax para que a rota trate de adicionar os pedidos
					$.get('addPedido/', json, function(data) {
						atualizarTabela();
						//remove as bordas dos itens selecionados (é uma forma de confirmação que o produto foi adicionado)
						desselecionarProdutos();
					});	
				}
			}
	}

	

	//desseleciona todos os produtos (para facilitar para o usuário que selecionou vários itens e deseja cancelar a operação)
	function desselecionarProdutos() {
		//retira a borda de todos os produtos selecionados e apaga o array de itens
		apagarBordasProdutos();
		$("#contadorProdutosSelecionados").css('display', 'none');
		$("#desselecionarProdutos").css('display', 'none');
		contadorProdutosSelecionados = 0;
		$("#contadorProdutosSelecionados").html(contadorProdutosSelecionados + " produtos selecionados");
	}

	//apaga as bordas dos produtos e zera o array de produtos
	function apagarBordasProdutos() {
		divCadaItem.css("border", "0px none rgb(51, 51, 51)");
		divCadaItem.css("box-shadow", "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)");
		divCadaItem.attr("data-clicked", 0);
		produtos = [];
		arrayProdutosAlterados = [];
	}


	//abre o modal de detalhes de uma determinada conta
	function abrirDetalhes() {
		$("#myModal").modal('show');
	}

	//abre o modal relacionado aos detalhes do pedido
	function abrirModalDetalhes(id, categoria, nome, preco) {
		$("#modalDetalhesPedido").modal('show');
	}


	$('#modalDetalhesPedido').on('show.bs.modal', function(e) {
			var id = $(e.relatedTarget).data('id');
			//populate the textbox

		    $(e.currentTarget).find('input[name="id"]').text(id);
	})

	/*  */
	function visualizarHistoricoCliente() {

	}


	//adicionbado em 12/1/2017
	/* abre o modal de detalhes para pedidos relacionados a sanduiches */
	function abrirModalSanduiches(id, nome, preco, urlImagem) {
		
		var modal = $("#modalDetalhesPedidoSanduiches");
		//altera a url da imagem, nome e preço
		modal.find('.imagem').attr('src', urlImagem);
		modal.find('.nome').text(nome);
		modal.find('.preco').text("R$" + preco.toFixed(2));

		//precisamos, a partir do id do sanduíche, buscar quais sãos os ids
		//dos itens que este sanduíche possui
		//percorrer cada item listado no modal e caso o item corresponda a um item do sanduíche
		//marcar 1 em '.input-number'
		//marcar a checkbox
		//data: array contendo ids dos itens que compõe o determinado produto
		$.get('/encontrarItens', {'idProduto': id}, function(data) {
			$.each(data, function(e, objItem) {
				var itemId = objItem['item_id'];
				
				$("[name='ok']").each(
					function() {
						var id = $(this).attr('data-id');
						//console.log($(this).attr('data-id'));
						if (itemId == id) {
							$(this).css('visibility', 'visible');
							$(this).parents().eq(1).next().find(".input-number").val(1);
							$(this).parents().eq(1).next().find(".btn-number").eq(0).attr('disabled', false);
						}
					}
				);

			});
		});

		//abre o modal
		modal.modal('toggle');
	}

	$("#modalDetalhesPedidoSanduiches").on('hidden.bs.modal', function(e) {
		$("[name='ok']").each(
			function() {
				$(this).css('visibility', 'hidden');
				$(this).parents().eq(1).next().find(".input-number").val(0);
				$(this).parents().eq(1).next().find(".btn-number").eq(0).attr('disabled', true);
			}
		);
	});

	//acionado ao clicar em "+" no modal de detalhes do sanduíche
	//
	function adicionarItemAoPedido(nome, precoVenda) {
		console.log(nome + precoVenda);
	}


	/* adicionado em 13/1/2017
	Este JS está relacionado apenas ao modal de adicionar detalhes aos pedidos (é apenas a funcionalidade de + e -)
	Creditos: http://bootsnipp.com/snippets/featured/buttons-minus-and-plus-in-input
	*/
	 $('.btn-number').click(function(e) {
	    e.preventDefault();
	    
	    fieldName = $(this).attr('data-field');
		type      = $(this).attr('data-type');
	    var input = $("input[name='"+fieldName+"']");
	    var currentVal = parseInt(input.val());

	    //busca o preço total atual do produto + adicionais (será atualizado a cada + ou - pressionado)
	    var precoAtual = $(".preco").html();
	    //retira desse preço atual o R$
	    precoAtual = parseFloat(precoAtual.substr(2, precoAtual.length));
	    
	    if (!isNaN(currentVal)) {
	        //botão menos
	        if(type == 'minus') {
	            
	            //caso o valor seja diferente de zero
	            if(currentVal >= input.attr('min')) {
	                input.val(currentVal - 1).change();
	            	var precoVenda = parseFloat($(this).parents().eq(4).attr('data-valor'));
	            	var precoAdicional = ((currentVal - 1) * precoVenda).toFixed(2);
	            	
	            	//altera o preço adicional na página html
	            	$(this).parents().eq(4).find('.precoTotal').children().html("R$ " + precoAdicional);
	            	//atualiza o preço total
	            	precoAtual -= parseFloat(precoVenda);
	            	//altera o preço total
	            	$(".preco").html("R$" + precoAtual.toFixed(2));
	            } 

	            //caso atinja o valor zero
	            if(parseInt(input.val()) == input.attr('min')) {
	                $(this).attr('disabled', true);
	                //desabilita o icone check
	                $(this).parents().eq(5).find("[name='ok']").css('visibility', 'hidden');
	            }

	        //botão mais
	        } else if(type == 'plus') {
	        	
	            if(currentVal < input.attr('max')) {
	            	input.val(currentVal + 1).change();
	                // var id = $(this).parents().eq(4).attr('data-id');
	                var precoVenda = parseFloat($(this).parents().eq(4).attr('data-valor'));
	                var precoAdicional = ((currentVal+1) * precoVenda).toFixed(2);
	                //altera o preço adicional na página html
	                $(this).parents().eq(4).find('.precoTotal').children().html("R$ " + precoAdicional);
	                //atualiza o preço total
	            	precoAtual += parseFloat(precoVenda);
	            	//altera o preço total
	            	$(".preco").html("R$" + precoAtual.toFixed(2));

	            	//habilita o icone check
	            	$(this).parents().eq(5).find("[name='ok']").css('visibility', 'visible');
	            }

	            if(parseInt(input.val()) == input.attr('max')) {
	                $(this).attr('disabled', true);
	            }
	        }
	    } else {
	        input.val(0);
	    }
	});


	$('.input-number').focusin(function(){
	   $(this).data('oldValue', $(this).val());
	});

	$('.input-number').change(function() {
	    
	    minValue =  parseInt($(this).attr('min'));
	    maxValue =  parseInt($(this).attr('max'));
	    valueCurrent = parseInt($(this).val());
	    
	    name = $(this).attr('name');
	    if(valueCurrent >= minValue) {
	        $(".btn-number[data-type='minus'][data-field='"+name+"']").removeAttr('disabled')
	    } else {
	        alert('Sorry, the minimum value was reached');
	        $(this).val($(this).data('oldValue'));
	    }

	    if(valueCurrent <= maxValue) {
	        $(".btn-number[data-type='plus'][data-field='"+name+"']").removeAttr('disabled')
	    } else {
	        alert('Sorry, the maximum value was reached');
	        $(this).val($(this).data('oldValue'));
	    }    
	});

	$(".input-number").keydown(function (e) {
	    // Allow: backspace, delete, tab, escape, enter and .
	    if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 190]) !== -1 ||
	         // Allow: Ctrl+A
	        (e.keyCode == 65 && e.ctrlKey === true) || 
	         // Allow: home, end, left, right
	        (e.keyCode >= 35 && e.keyCode <= 39)) {
	             // let it happen, don't do anything
	             return;
	    }
	    // Ensure that it is a number and stop the keypress
	    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
	        e.preventDefault();
	    }
	});
	/* fim do js e fim dos créditos */

