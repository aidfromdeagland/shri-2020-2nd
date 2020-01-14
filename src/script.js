//import {index} from './tempTest/index';
// import {product} from './tempTest/product';
// import {warning} from './tempTest/warning';


// решение с получением массива блоков и отдельного массива с конкретными модификаторами этих блоков  связано с тем, что используемый обходун AST дерева во время обхода не позволяет обратиться к предку старше непосредственного родителя, а самому написать обход дерева с такой возможностью я не горазд)

globalThis.lint = function(json) {
  let errorInfo = {
    warning: {
    textSize: {code: 'WARNING.TEXT_SIZES_SHOULD_BE_EQUAL', message: 'Размер муравьев варьируется от одного до десятков миллиметров, а все текстовые блоки должны быть одного размера.'},
    buttonSize: {code: 'WARNING.INVALID_BUTTON_SIZE', message: 'Еще мой дед говорил, что размер кнопки должен быть на один шаг больше размера текста.'},
    buttonPosition: {code: 'WARNING.INVALID_BUTTON_POSITION', message: 'Сегодня в завтрашний день не все могут смотреть. Вернее, смотреть могут не только лишь все, мало кто может делать кнопку в блоке warning перед блоком placeholder на том же или более глубоком уровне вложенности. И мы так делать не будем.'},
    placeholderSize: {code: 'WARNING.INVALID_PLACEHOLDER_SIZE', message: 'Размерный ряд плейсхолдера: s, m, l. Всё. Не надо вот этого вот AliExpress купить футболка благородный xxxxxs-XXXXXL подходить величина'}
    },// семь раз отмерь, один
  
  };
  

  let errors = []; // массив с ошибками
  const sizes = ['s', 'm', 'l', 'xl', 'xxl', 'xxxl']; // возможные размеры текста (за исключением последнего) для определения требуемого размера "button"
  let warningBlock = []; // массив с блоками "warning"
  let texts = []; // массив с блоками "text"
  let textSizes = []; // массив с значениями модификаторов "size" блоков "text"
  let buttons = [];
  let buttonSizes = [];
  let placeholders = [];
  let placeholderSizes = [];
  let placeholderLegalSizes = ['s', 'm', 'l'];
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
  
  
  let getWarningBlock = function (node, context) {
    if (node.children && node.children[0].value && node.children[0].value.value === "warning" && node.children.every(x => x.value.value !== "elem")) {
      warningBlock.push(node);
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

  let getButtons = function (node, context) {
    if (node.children && node.children[0].value && node.children[0].value.value === "button") {
      buttons.push(node);
      context.skip();
    }
  }

  let getButtonSizes = function (node, context) {
    if (node.key && node.key.value === "size") {
      buttonSizes.push(node.value.value);
      context.skip();
    }
  };

  let getPlaceholders = function (node, context) {
    if (node.children && node.children[0].value && node.children[0].value.value === "placeholder") {
      placeholders.push(node);
      context.skip();
    }
  }

  let getPlaceholderSizes = function (node, context) {
    if (node.key && node.key.value === "size") {
      placeholderSizes.push(node.value.value);
      context.skip();
    }
  };

  crawl(ast, getWarningBlock);  // получаем блок "warning"
  warningBlock.forEach(x => crawl(x, getTexts)); // получаем блоки "text"
  texts.forEach(x => crawl(x, getTextSizes)); // получаем значения модификаторов "size" блоков "text"
  let defaultSize = textSizes[0]; // сохраняем значение эталонного размера в переменную

  warningBlock.forEach(x => crawl(x, getButtons)); // получаем блоки "button"
  buttons.forEach(x => crawl(x, getButtonSizes)); // получаем значения модификаторов "size" блоков "button"

  warningBlock.forEach(x => crawl(x, getPlaceholders)); // получаем блоки "placeholder"
  placeholders.forEach(x => crawl(x, getPlaceholderSizes));// получаем значения модификаторов "size" блоков "placeholder"
  
  
  
  if (texts[0]) {
    if (texts.length !== textSizes.length) {  //проверка на наличие модификаторов размера всех блоков "text"
    errors.push(new LintError(errorInfo.warning.textSize.code, errorInfo.warning.textSize.message, warningBlock[0].loc))
    } else {
      for (let i = 0; i < textSizes.length; i++) {
        if (textSizes[i] !== defaultSize) { // проверка на соответствие значения модификатора "size" всех блоков "text" эталонному
        errors.push(new LintError(errorInfo.warning.textSize.code, errorInfo.warning.textSize.message, warningBlock[0].loc));
        break}
      }
    }
  }
  

  if (defaultSize && buttons[0]) {
    for (let i = 0; i < buttonSizes.length; i++) {
      if (buttonSizes[i] !== sizes[sizes.indexOf(defaultSize) + 1]) { // проверка на соответствие значения модификатора "size" всех блоков "button"   эталонному
      errors.push(new LintError(errorInfo.warning.buttonSize.code, errorInfo.warning.buttonSize.message, buttons[i].loc));
      }
    }
  }

  if (placeholders[0]) {
    for (let i = 0; i < buttons.length; i++) {
      if (buttons[i].loc.start.line < placeholders[0].loc.start.line) { // проверка на нахождение блока "placeholder" (только для первого блока) после "button" в строке. (не работает, если button в более высоком уровне вложенности)
      errors.push(new LintError(errorInfo.warning.buttonPosition.code, errorInfo.warning.buttonPosition.message, buttons[i].loc));
      }
    }

    for (let i = 0; i < placeholderSizes.length; i++) {
      if (!placeholderLegalSizes.includes(placeholderSizes[i])) { // проверка соответствия значения модификатора "size" блоков "placeholder" диапазону заданных размеров )
      errors.push(new LintError(errorInfo.warning.placeholderSize.code, errorInfo.warning.placeholderSize.message, placeholders[i].loc));
      }
    }
  }

  return errors;
}



