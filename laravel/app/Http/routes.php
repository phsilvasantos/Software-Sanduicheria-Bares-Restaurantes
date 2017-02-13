<?php

use App\Pedido;
use App\Funcionario;
use App\ProdutosItens;
use App\Produto;
use App\Conta;
use App\ContasProdutos;

// Authentication routes...
Route::get('auth/login', 'Auth\AuthController@getLogin');
Route::post('auth/login', 'Auth\AuthController@postLogin');
Route::get('auth/logout', 'Auth\AuthController@getLogout');

// Registration routes...
Route::get('auth/register', 'Auth\AuthController@getRegister');
Route::post('auth/register', 'Auth\AuthController@postRegister');

Route::get('/', 'HomeController@index');

//rotas agrupadas pois utilizam o mesmo prefixo /administrador/ ... e porque são rotas restritas a usuários autenticados
Route::group(['prefix' => 'administrador'], function() {
	Route::get('/', 'AdministradorController@index');
	Route::get('/listarProdutos', 'ProdutosController@index');
	Route::get('/listarProdutos/novoProduto', 'ProdutosController@create');	
	Route::get('/listarProdutos/editarProduto{id}', ['as' => 'editarProduto', 'uses' => 'ProdutosController@edit']);
	Route::put('/listarprodutos/updateProduto{id}', ['as' => 'updateProduto', 'uses' => 'ProdutosController@update']);
	Route::get('/listarProdutos/filtrar/', ['as' => 'filtrarProduto', 'uses' => 'ProdutosController@filtrar']);
	
	Route::get('/listarItens', ['as' =>'listarItens', 'uses' => 'ItensController@index']);
	Route::get('/listarItens/novoItem', 'ItensController@create');
	Route::get('/listarItens/editarItem{id}', ['as' => 'editarItem', 'uses' => 'ItensController@edit']);
	Route::get('/listarProdutos/filtrar/', ['as' => 'filtrarItem', 'uses' => 'ItensController@filtrar']);
	Route::post('/salvarItem', 'ItensController@store');
	Route::put('/listarItens/updateItem{id}', ['as' => 'updateItem', 'uses' => 'ItensController@update']);
	
	Route::get('/contasEncerradas', 'ContasController@index');

	Route::get('/listarFuncionarios', 'FuncionariosController@index');
	Route::get('/listarFuncionarios/novoFuncionario', 'FuncionariosController@create');
	Route::get('/listarFuncionarios/editarFuncionario{id}', ['as' => 'editarFuncionario', 'uses'=>'FuncionariosController@edit']);
	Route::put('/listarFuncionarios/updateFuncionario{id}', ['as' => 'updateFuncionario', 'uses' => 'FuncionariosController@update']);

	
});


//Esta rota existe porque a alguns produtos podem ser adicionados itens, alterando assim seu valor final
Route::get('/addPedidoComItens', function() {
	$contadorProdutos = 0; //contador de produtos que serão adicionados

	//busca os dados da view
	$input = Input::only('idConta', 'produtos', 'produtosAlterados');
	$idConta = $input['idConta'];
	$produtosAlterados = $input['produtosAlterados'];	//produtos que nao foram adicionados itens
	$produtosNaoAlterados = $input['produtos'];	//produtos para o qual foram adicionados itens, portanto seu valor final sera alterado
												//obs: isso eh um array de obj, contendo o id do produto e o preco final

	/* observacao importante: em $produtosNaoAlterados vem tambem os ids dos produtos alterados, preciso retirar estes ids para nao repetir no banco */
	//percorre todos os produtos alterados para buscar dentro de produtos nao alterados qual possui o mesmo id, para retirar
	foreach($produtosAlterados as $produtoAlterado) {
		$id = $produtoAlterado['id'];
		foreach($produtosNaoAlterados as $key => $pna) {		//percorre todos os produtos nao alterados
			if ($pna == $id)									//caso o id do produto alterado seja igual ao do nao alterado
				array_splice($produtosNaoAlterados, $key, 1);	//retira o elemento repetido do array de nao alterados
		}

		//aproveitando o foreach de produtos alterados, podemos adicionar ao banco adicionando o preco correto
		$contadorProdutos++;		//incrementa o contador de produtos para o garcom
		$idProduto = $produtoAlterado['id'];
		$precoProduto = $produtoAlterado['preco'];		//pega o novo preco, com o valor dos itens embutidos
		$contasProdutos = new App\ContasProdutos();		//nova instancia de contasprodutos
		$contasProdutos['conta_id'] = $idConta;			
		$contasProdutos['precoFinal'] = $precoProduto;
		$contasProdutos['produto_id'] = $idProduto;
		$contasProdutos->save();						//salva no banco

	}

	/* agora que adicionamos os produtos alterados, devemos adicionar os produtos nao alterados */
	foreach($produtosNaoAlterados as $pna) {
		$contadorProdutos++;
		$idProduto = $pna;
		$contasProdutos = new App\ContasProdutos();
		$contasProdutos['conta_id'] = $idConta;
		$contasProdutos['produto_id'] = $idProduto;

		//temos que buscar no banco de dados qual eh o valor real do produto (sem alteracoes de itens)
		$produtos = new App\Produto();
		$objProduto = $produtos->select('precoVenda')->where('id', '=', $idProduto)->first();
		$contasProdutos['precoFinal'] = $objProduto->precoVenda;
		$contasProdutos->save();

	}

	atualizarProdutosDoGarcom($idConta, $contadorProdutos);
});


//recebe uma requisição ajax da view do garçom e adiciona novos produtos na conta, baseado nos IDs dos ítens
//e no número da conta referente à mesa
Route::get('/addPedido', function() {
	
	$contadorProdutos = 0; //contador de produtos que serão adicionados

	//busca os dados da view
	$input = Input::only('idConta', 'produtos');
	$idConta = $input['idConta'];
	
	//percorre o array de produtos e insere no banco (tabela: contasProdutos)
	foreach($input['produtos'] as $idProduto) {
		$contadorProdutos++;
		$idProduto = trim($idProduto);
		$contasProdutos = new App\ContasProdutos();
		$contasProdutos['conta_id'] = $idConta;	
		$contasProdutos['produto_id'] = $idProduto;

		//busca o preco do produto para preencher o campo precoFinal
		$produto = new App\Produto();
		$obj = $produto->select('precoVenda')->where('id', '=', $idProduto)->first();
		$precoFinal = $obj->precoVenda;
		$contasProdutos['precoFinal'] = $precoFinal;	//obs: o preco final deste produto eh igual ao preco de venda dele, diferente de quando se adiciona 
		
		$contasProdutos->save();
	}

	atualizarProdutosDoGarcom($idConta, $contadorProdutos);
});

//helper function apenas para não repetir código (utilizado nas rotas /addPedido e /addPedidoComItens)
function atualizarProdutosDoGarcom($idConta, $contadorProdutos) {


/* apenas atualiza o número de vendas do garçom */
	//busca qual funcionário é o responsável por esses produtos

	//cria uma nova instância de 'contas'
	$contas = new App\Conta();
	//pega o ID do funcionário relacionado a esta conta (para aumentar o número de produtos vendidos)
	$idFuncionario = $contas->where('id', '=', $idConta)->select('funcionario_id')->first();
	//apenas uma conversão
	$idFuncionario = $idFuncionario['funcionario_id'];

	$funcionarios = new App\Funcionario();
	//pega quantos produtos ja foram vendidos até então por este funcionário
	$produtosVendidos = $funcionarios->where('id', '=', $idFuncionario)->select('produtosVendidos')->first();

	//apenas uma conversão
	$produtosVendidos = $produtosVendidos['produtosVendidos'];

	//incrementa com o número de produtos que foram adicionados
	$produtosVendidos += $contadorProdutos;
	
	//salva no banco o novo valor
	$funcionario = $funcionarios->where('id', '=', $idFuncionario)->first();
	$funcionario['produtosVendidos'] = $produtosVendidos;
	$funcionario->update();

}


//rota que irá retornar uma o id da conta que está relacionada ao número da mesa
Route::get('/buscarContaRelacionada', function() {
	//busca os dados do ajax
	$input = Input::only('numeroMesa');
	//usei isso apenas porque $input era um array, mas quero a string que tá dentro dele, na posição 'numeroMesa'
	$numeroMesa = $input['numeroMesa'];

	//para buscar o id da conta relacionado ao número desta mesa:
	//verificar se existe alguma conta não encerrada (encerrada = false) cujo valor da mesa é igual ao parâmetro passado
	$contas = new App\Conta();
	$contaDesejada = $contas->where('mesa_numero', '=', $numeroMesa)->where('encerrada', '=', '0')->first();

	if (is_null($contaDesejada)) {	//caso nenhuma conta para esta mesa tenha sido encontrada
		return -1;	//retorna -1 para a home.blade.php tratar e fazer alterações na  view
	}

	return $contaDesejada['id'];

});

//dado o número da conta, busca o nome e o preço de  todos os produtos relacionados a esta conta
Route::get('/buscarProdutos', function() {
	$input = Input::only('idConta');
	$idConta = $input['idConta'];

	//faz um inner join.
	//na tabela 'conta_produtos' existe a coluna produto.id e quero relacionar este id com o id da tabela produtos
	//busco, então, o preco de venda, o nome e a quantidade
	
	// $contaProdutos = new App\ContasProdutos();
	// $dados = $contaProdutos
	// ->where('conta_produtos.conta_id', '=', $idConta)
	// ->join('produtos', 'conta_produtos.produto_id', '=', 'produtos.id')
	// ->select('conta_produtos.conta_id', 'produtos.nome', 'produtos.precoVenda', DB::raw('count(*) as quantidade'))		//DB::RAW faz uma query SQL normal
	// ->groupBy('produtos.id')
	// ->get();

	// return $dados;

	$contaProdutos = new App\ContasProdutos();
	$dados = $contaProdutos
	->where('conta_produtos.conta_id', '=', $idConta)
	->join('produtos', 'conta_produtos.produto_id', '=', 'produtos.id')
	->select('conta_produtos.conta_id', 'produtos.nome', 'conta_produtos.precoFinal', DB::raw('count(*) as quantidade'))		//DB::RAW faz uma query SQL normal
	->groupBy('produtos.id')
	->get();

	return $dados;


});


//dado o número da conta, busca o nome, o preço e   todos os produtos relacionados a esta conta
Route::get('/buscarProdutosComDetalhes', function() {
	$input = Input::only('idConta');
	$idConta = $input['idConta'];

	//faz um inner join.
	//na tabela 'conta_produtos' existe a coluna produto.id e quero relacionar este id com o id da tabela produtos
	//busco, então, o preco de venda, o nome e a quantidade
	
	$contaProdutos = new App\ContasProdutos();
	$dados = $contaProdutos
	->where('conta_produtos.conta_id', '=', $idConta)
	->join('produtos', 'conta_produtos.produto_id', '=', 'produtos.id')
	->select('conta_produtos.conta_id', 'conta_produtos.created_at', 'produtos.nome', 'produtos.precoVenda')		//DB::RAW faz uma query SQL normal
	->orderBy('conta_produtos.created_at', 'asc')
	->get();

	return $dados;
});


//rota que irá encerrar uma conta
Route::get('/encerrarConta', function() {

	$contas = new App\Conta();
	$id = Input::get('id');			//busca o id da conta

	$conta = $contas->where('id', '=', $id)->first();	//busca no banco a conta com o ID dado
	$conta['encerrada'] = true;	//coloca o valor de encerrada em true
	$conta->update();	//update

	return 0;
});


Route::get('/criarNovaConta', function() {
	
		$input = Input::only('idFuncionario', 'numeroMesa');
		$numeroMesa = $input['numeroMesa'];
		$idFuncionario = $input['idFuncionario'];

		//cria uma nova conta, seta os dados
		$novaConta = new App\Conta();
		$novaConta['mesa_numero'] = $numeroMesa;
		$novaConta['valor'] = 0;
		$novaConta['encerrada'] = false;
		$novaConta['funcionario_id'] = $idFuncionario;
		$novaConta->save();	//salva no banco
		//busca novamente o id

		$contas = new App\Conta();
		$contaDesejada = $contas->where('mesa_numero', '=', $numeroMesa)->where('encerrada', '=', '0')->first();

		return 0;
});


Route::get('/buscaFuncionario', function() {
		$input = Input::only('idConta');
		$idConta = $input['idConta'];

		$contas = new App\Conta();

		$contaFuncionario = $contas->where('id', '=', $idConta)->select('funcionario_id')->get();
		$idFuncionario = trim($contaFuncionario[0]["funcionario_id"]);
		
		//query utilizada apenas para buscar o nome do funcionário
		$funcionarios = new App\Funcionario();
		$funcionario = $funcionarios->where('id', '=', $idFuncionario)->select('nome')->get();
		
		return $funcionario;		//retorna o nome do funcionário (é utilizado para mostrar na tela quem é o funcionário responsável)
});


//para cancelar um produto preciso do nome do produto e do ID da conta
Route::get('/cancelarProduto', function() {
	
	//busca os dados que vêm da view
	$nomeProduto = Input::get('nomeProduto');
	$idConta = Input::get('idConta');

	//cria uma nova instância de 'contas'
	$contas = new App\Conta();
	//pega o ID do funcionário relacionado a esta conta (para aumentar o número de produtos vendidos)
	$idFuncionario = $contas->select('funcionario_id')->where('id', '=', $idConta)->first();
	//apenas uma conversão
	$idFuncionario = $idFuncionario['funcionario_id'];

	$funcionarios = new App\Funcionario();
	//pega quantos produtos ja foram vendidos até então por este funcionário
	$produtosVendidos = $funcionarios->where('id', '=', $idFuncionario)->select('produtosVendidos')->first();
	//apenas uma conversão 
	$produtosVendidos = $produtosVendidos['produtosVendidos'];
	//retira 1
	$produtosVendidos--;
	//salva no banco o novo valor
	$funcionario = $funcionarios->where('id', '=', $idFuncionario)->first();
	$funcionario['produtosVendidos'] = $produtosVendidos;
	$funcionario->update();


	$produtos = new App\Produto();
	$idProduto = $produtos->where('nome', '=', $nomeProduto)->select('id')->first();		//busca o ID do produto 
	
	$idProduto = $idProduto['id'];
	
	$cp = new App\ContasProdutos();	
	$cp->where('conta_id', '=', $idConta)->where('produto_id', '=', $idProduto)->first()->delete();	//deleta o produto da tabela conta_produtos

});

Route::post('/salvarFuncionario', 'FuncionariosController@store');
//Route::get('/excluirGarcom/{id}', ['as' => 'excluirGarcom', 'uses' => 'FuncionariosController@destroy']);
Route::get('/excluirGarcom/', ['as' => 'excluirGarcom', 'uses' => 'FuncionariosController@destroy']);
Route::get('/excluirItem', ['as' => 'excluirItem', 'uses' => 'ItensController@destroy']);
Route::get('/excluirProduto', ['as' => 'excluirProduto', 'uses' => 'ProdutosController@destroy']);
Route::post('/salvarProduto', 'ProdutosController@store');

Route::get('/excluirContaEncerrada', ['as' => 'excluirContaEncerrada', 'uses' => 'ContasController@destroy']);

//retorna os itens que são utilizados em um determinado produto
Route::get('/encontrarItens', function() {
	$id = Input::get('idProduto');
	$produtosItens = new ProdutosItens();
	//$idsItens = array de ids dos itens de um determinado produto
	$idsItens = $produtosItens->where('produto_id', '=', $id)->select('item_id')->get();

	return $idsItens;
});

Route::controllers([
	'auth' => 'Auth\AuthController',
	'password' => 'Auth\PasswordController',
]);