//import {index} from './tempTest/index';
// import {product} from './tempTest/product';
// import {warning} from './tempTest/warning';

globalThis.linter = function(json) {
  let errorInfo = {
    warning: {
    textSize: {code: 'WARNING.TEXT_SIZES_SHOULD_BE_EQUAL', message: 'Размер муравьев варьируется от одного до десятков миллиметров, а все текстовые блоки должны быть одного размера.'},
    buttonSize: {code: 'WARNING.INVALID_BUTTON_SIZE', message: 'Еще мой дед говорил, что размер кнопки должен быть на один шаг больше размера текста.'},
    buttonPosition: {code: 'WARNING.INVALID_BUTTON_POSITION', message: 'Сегодня в завтрашний день не все могут смотреть. Вернее, смотреть могут не только лишь все, мало кто может делать кнопку в блоке warning перед блоком placeholder на том же или более глубоком уровне вложенности. И мы так делать не будем.'},
    placeholderSize: {code: 'WARNING.INVALID_PLACEHOLDER_SIZE', message: 'Размерный ряд плейсхолдера: s, m, l. Всё. Не надо вот этого вот AliExpress купить футболка благородный xxxxxs-XXXXXL подходить величина'}
    },
  
  };
  
  let errors = []; // массив с ошибками
  let warningBlocks = []; // массив с блоками "warning"
  let texts = []; // массив с блоками "text"
  let textSizes = []; // массив с значениями модификаторов "size" блоков "text"
  let JSONtoAST = require('json-to-ast'); 
  let crawl = require('tree-crawl');
  let ast = JSONtoAST(json); // результат парсинга входной строки в AST
  let LintError = function (code, errorMessage, location) { // конструктор для генерации объектов с описанием ошибок
    this.code = code;
    this.errorMessage = errorMessage;
    this.location = {
      start: { column: location.start.column, line: location.start.line },
      end: { column: location.end.column, line: location.end.line }
    };
  };
  
  
  let getWarningBlocks = function (node, context) {
    if (node.children && node.children[0].value && node.children[0].value.value === "warning" && node.children.every(x => x.value.value !== "elem")) {
      warningBlocks.push(node);
      context.skip();
    }
  };
  
  let getTexts = function (node, context) {
    if (node.children && node.children[0].value.value === "text" && node.children.every(x => x.value.value !== "word")) {
      texts.push(node);
      context.skip();
    }
  }
  
  let getTextSizes = function (node, context) {
    if (node.key && node.key.value === "size") {
      textSizes.push(node.value.value);
      context.skip();
    }
  };
  
  
  crawl(ast, getWarningBlocks);  // получаем блоки "warning"
  warningBlocks.forEach(x => crawl(x, getTexts)); // получаем блоки "text"
  texts.forEach(x => crawl(x, getTextSizes)); // получаем значения модификаторов "size" из блоков "text"
  let defaultSize = textSizes[0]; // сохраняем значение эталонного размера в переменную
  
  if (texts.length !== textSizes.length) {  //проверка на наличие модификаторов размера всех блоков "text"
    errors.push(new LintError(errorInfo.warning.textSize.code, errorInfo.warning.textSize.message, warningBlocks[0].loc))
  } else {
    for (let i = 0; i < textSizes.length; i++) {
      if (textSizes[i] !== textSizes[0]) { // проверка на соответствие размера всех блоков "text" эталонному
      errors.push(new LintError(errorInfo.warning.textSize.code, errorInfo.warning.textSize.message, warningBlocks[0].loc));
      break}
    }
  }

  return errors;
}



