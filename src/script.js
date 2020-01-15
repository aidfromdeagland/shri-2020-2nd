globalThis.lint = function(json) {

  const errorInfo = {
    warning: {
      textSize: {
        code: 'WARNING.TEXT_SIZES_SHOULD_BE_EQUAL', 
        message: 'Размер муравьев варьируется от одного до десятков миллиметров, а все текстовые блоки должны быть одного размера.'},
      buttonSize: {
        code: 'WARNING.INVALID_BUTTON_SIZE', 
        message: 'Еще мой дед говорил, что размер кнопки должен быть на один шаг больше размера текста.'},
      buttonPosition: {
        code: 'WARNING.INVALID_BUTTON_POSITION', 
        message: 'Сегодня в завтрашний день не все могут смотреть. Вернее, смотреть могут не только лишь все, мало кто может делать кнопку в блоке warning перед блоком placeholder на том же или более глубоком уровне вложенности. И мы не будем.'},
      placeholderSize: {
        code: 'WARNING.INVALID_PLACEHOLDER_SIZE', 
        message: 'Размерный ряд плейсхолдера: s, m, l. Всё. Не надо вот этого вот AliExpress купить футболка благородный xxxxxs-XXXXXL подходить величина'}
    },
    header: {
      h1Quantity: {
        code: 'TEXT.SEVERAL_H1', 
        message: 'SEOшник даст подзатыльник, если увидит больше одного заголовка H1.'}, 
      h2Position: {
        code: 'TEXT.INVALID_H2_POSITION', 
        message: 'Что появилось раньше: яйцо или курица, я не знаю, но H1 на странице должен появляться раньше, чем H2.'},
      h3Position: {
        code: 'TEXT.INVALID_H3_POSITION', 
        message: 'В обществе заголовков старшим надо уступать. Поставь H3 после H2'}
    },
    marketingBlocks: {
      tooMuchMarket: {
        code: 'GRID.TOO_MUCH_MARKETING_BLOCKS', 
        message: 'Не страница, а билборд! Уменьшить долю маркетингового контента!'}
    }
  };
  
  const JSONtoAST = require('json-to-ast'); // парсер JSON в абстрактное синтаксическое дерево
  const crawl = require('tree-crawl'); // путешественник абстрактно-синтаксическо-древесный

  const errors = []; // массив с ошибками, который будет возвращаться в результате выполнения функции lint

  const LintError = function (code, errorMessage, location) { // конструктор для генерации объектов с описанием ошибок
    this.code = code;
    this.errorMessage = errorMessage;
    this.location = {
      start: { column: location.start.column, line: location.start.line },
      end: { column: location.end.column, line: location.end.line }
    };
  };

  let warningBlock; // блок 'warning'
  const warningTexts = []; // массив с блоками 'text'
  const warningTextSizes = []; // массив с значениями модификаторов 'size' блоков 'text'
  const warningTextLegalSizes = ['s', 'm', 'l', 'xl', 'xxl', 'xxxl']; // возможные размеры текста (за исключением последнего) для определения требуемого размера 'button'

  const buttons = [];
  const buttonSizes = [];

  const placeholders = [];
  const placeholderSizes = [];
  const placeholderLegalSizes = ['s', 'm', 'l'];


  const headers = [];
  const headerTypes = [];
  const headerLegalTypes = ['h1', 'h2', 'h3'];

  const marketBlockNames = ['commercial', 'offer'];
  let gridBlock;
  let gridColumns;
  const gridMarketingColumns = [];

  const ast = JSONtoAST(json); // результат парсинга входной строки в AST

  const getWarningBlock = function (node, context) {
    if (node.children && node.children[0].value && node.children[0].value.value === 'warning') {
      warningBlock = node;
      context.skip();
    }
  };

  const getWarningTexts = function (node, context) {
    if (node.children && node.children[0].value && node.children[0].value.value === 'text') {
      context.skip();
      warningTexts.push(node);

      crawl(node, function (nodeForProp, contextForProp) {
        if (nodeForProp.key && nodeForProp.key.value === 'size' && nodeForProp.value && nodeForProp.value.value)     {
          contextForProp.skip();
          warningTextSizes.push(nodeForProp.value.value); // добавляем значение модификатора 'size' блока 'text' в массив
        }
      })
    }
  }

  const getButtons = function (node, context) {
    if (node.children && node.children[0].value && node.children[0].value.value === 'button') {
      context.skip();
      buttons.push(node);
  
      crawl(node, function (nodeForProp, contextForProp) {
        if (nodeForProp.key && nodeForProp.key.value === 'size' && nodeForProp.value && nodeForProp.value.value)     {
          contextForProp.skip();
          buttonSizes.push(nodeForProp.value.value); // добавляем значение модификатора 'size' блока 'button' в массив
        }
      })
    }
  }

  const getPlaceholders = function (node, context) {
    if (node.children && node.children[0].value && node.children[0].value.value === 'placeholder') {
      context.skip();
      placeholders.push(node);
  
      crawl(node, function (nodeForProp, contextForProp) {
        if (nodeForProp.key && nodeForProp.key.value === 'size' && nodeForProp.value && nodeForProp.value.value)     {
          contextForProp.skip();
          placeholderSizes.push(nodeForProp.value.value); // добавляем значение модификатора 'size' блока 'placeholder' в массив
        }
      })
    }
  }

  const getHeaders = function (node, context) {
    if (node.children && node.children[0].value && node.children[0].value.value === 'text') {
      context.skip();
      let hasProperty = false; // флаг для дальнейшего решения об определении ноды как заголовка

      crawl(node, function (nodeForProp, contextForProp) {
        if (nodeForProp.key && nodeForProp.key.value === 'type' && nodeForProp.value && headerLegalTypes.includes(nodeForProp.value.value))     {
          contextForProp.skip();
          headerTypes.push(nodeForProp.value.value); // добавляем значение модификатора 'type' блока 'text' в массив
          hasProperty = true;
        }
      })

      if (hasProperty) {
        headers.push(node);
      }
    }
  }

  const getGridBlock = function (node, context) {
    if (node.children && node.children[0].value && node.children[0].value.value === 'grid') {
      context.skip();
      gridBlock = node;

      crawl(node, function (nodeForProp, contextForProp) {
        if (nodeForProp.key && nodeForProp.key.value === 'm-columns' && nodeForProp.value && nodeForProp.value.value)     {
          contextForProp.skip();
          gridColumns = nodeForProp.value.value; // определяем значение модификатора 'm-columns' блока 'gridBlaco'.
        }
      })
    }
  };

  const getGridFractions = function (node, context) {
    if (node.children && node.children[1] && node.children[1].value && node.children[1].value.value === 'fraction') {
      context.skip();

      crawl(node, function (nodeForProp) {
        if (nodeForProp.key && nodeForProp.key.value === 'm-col' && nodeForProp.value)     {
          
          crawl(node, function (nodeForMarket) {
            if (nodeForMarket.key && nodeForMarket.key.value === 'block' && nodeForMarket.value && marketBlockNames.includes(nodeForMarket.value.value))     {
              gridMarketingColumns.push(nodeForProp.value.value); // добавляем значение модификатора 'm-col' элемента 'grid__fraction' в массив
            }
          })
        }
      })
    }
  }
  
  
  // обходим необходимые ноды с целью поска нужных блоков / модификаторов


  crawl(ast, getWarningBlock);  // получаем блок 'warning'
  
  crawl(warningBlock, getWarningTexts); // получаем блоки 'text' блока 'warning' и значения их модификаторов 'size'
  let defaultSize = warningTextSizes[0]; // сохраняем значение эталонного размера в переменную

  crawl(warningBlock, getButtons); // получаем блоки 'button' блока 'warning' и значения их модификаторов 'size'

  crawl(warningBlock, getPlaceholders); // получаем блоки 'placeholder' блока 'warning' и значения их модификаторов 'size'

  crawl(ast, getHeaders); // получаем хедеры и значения модификатора 'type'

  crawl(ast, getGridBlock); // получаем блок 'grid';

  crawl(gridBlock, getGridFractions); // получаем элементы 'grid__fractions';


  // Собственно, кривой линтинг: 

  // линтим блок warning
  if (warningTexts.length) {
    if (warningTexts.length !== warningTextSizes.length) {  //проверка на наличие модификаторов размера всех блоков 'text'
    errors.push(new LintError(errorInfo.warning.textSize.code, errorInfo.warning.textSize.message, warningBlock.loc))
    } else {
      for (let i = 0; i < warningTextSizes.length; i++) {
        if (warningTextSizes[i] !== defaultSize) { // проверка на соответствие значения модификатора 'size' всех блоков 'text' эталонному
        errors.push(new LintError(errorInfo.warning.textSize.code, errorInfo.warning.textSize.message, warningBlock.loc));
        break}
      }
    }
  }
  
  if (defaultSize && buttons.length) {
    for (let i = 0; i < buttonSizes.length; i++) {
      if (buttonSizes[i] !== warningTextLegalSizes[warningTextLegalSizes.indexOf(defaultSize) + 1]) { // проверка на соответствие значения модификатора 'size' всех блоков 'button' эталонному
      errors.push(new LintError(errorInfo.warning.buttonSize.code, errorInfo.warning.buttonSize.message, buttons[i].loc));
      }
    }
  }

  if (placeholders.length) {
    for (let i = 0; i < buttons.length; i++) {
      if (buttons[i].loc.start.line < placeholders[0].loc.start.line) { // проверка на нахождение блока 'placeholder' (только для первого блока) после 'button' в строке. (не адекватно, если button в более высоком уровне вложенности)
      errors.push(new LintError(errorInfo.warning.buttonPosition.code, errorInfo.warning.buttonPosition.message, buttons[i].loc));
      }
    }

    for (let i = 0; i < placeholderSizes.length; i++) {
      if (!placeholderLegalSizes.includes(placeholderSizes[i])) { // проверка соответствия значения модификатора 'size' блоков 'placeholder' диапазону заданных размеров )
      errors.push(new LintError(errorInfo.warning.placeholderSize.code, errorInfo.warning.placeholderSize.message, placeholders[i].loc));
      }
    }
  }


  //линтим заголовки
  if (headers.length) {
    if (headerTypes.filter(x => x === 'h1').length && headerTypes.filter(x => x === 'h1').length > 1) {
      let validH1Index = headerTypes.indexOf('h1');
      headerTypes.slice(validH1Index + 1).forEach((x, index) => {
        if (x === 'h1') {
          errors.push(new LintError(errorInfo.header.h1Quantity.code, errorInfo.header.h1Quantity.message, headers.slice(validH1Index + 1)[index].loc));
        }
      })  
    }

    headerTypes.forEach((x, index) => {
      if (x === 'h2' && headerTypes.slice(index).includes('h1')) {
        errors.push(new LintError(errorInfo.header.h2Position.code, errorInfo.header.h2Position.message, headers[index].loc))
      } else {
        if (x === 'h3' && headerTypes.slice(index).includes('h2')) {
          errors.push(new LintError(errorInfo.header.h3Position.code, errorInfo.header.h3Position.message, headers[index].loc))
        }
      }
    })
  }


  //линтим грид на маркетблоки
  if (gridBlock && gridColumns && gridMarketingColumns.length) {
    if (gridMarketingColumns.reduce((accumulator, currentValue) => accumulator + currentValue) > gridColumns / 2) {
      errors.push(new LintError(errorInfo.marketingBlocks.tooMuchMarket.code, errorInfo.marketingBlocks.tooMuchMarket.message, gridBlock.loc))
    }
  }

  return errors;
}



