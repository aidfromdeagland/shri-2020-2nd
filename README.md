  ### Линтер ###

  #### Заводим пепелац: ####
1. Установить зависимости: npm i;
2. Сборка запускается командой  npm run build. 


  Исходник расположен в папке `/src`. Бандл - в папке `/build`.  
  
  В качестве сборщика выбрал webpack, т.к. он из коробки минифицирует код.
  В качестве парсера JSON в АСД я использовал json-to-ast. Опыта работы с синтаксическими деревьями у меня нет, поэтому использовал первое, чем получилось добиться необходимой структуры кода на выходе. Пытался щупать babylon и esprima - не нашел способа ими вывести что-либо толкове из JSON. Так же json-to-ast понравился тем, что им же можно парсить наглядно онлайн на https://astexplorer.net/.  
  
  Написать самому обходчик дерева мне еще слабо, поэтому у меня в зависимостях появился tree-crawl. Сначала он не хотел ходить нормально, потому что детей в узле он искал только в свойстве "children": `if (node.children) {return node.children};`, в конце концов добился нужного поведения.
  
<hr>
# Задание 2. Напишите линтер

В этом репозитории находятся материалы тестового задания «Напишите линтер» для [16-й Школы разработки интерфейсов](https://yandex.ru/promo/academy/shri) (зима 2020, Москва).

## Задание

Вам нужно написать линтер, проверяющий, что структура блоков интерфейса соответствует [правилам](#style-guide). В качестве решения приложите исходный код и запускаемый файл линтера.

Запускаемый файл должен называться `linter.js` и находиться в репозитории в папке `build`. Размер файла — не более 1 МБ. Код файла должен создавать в глобальной области видимости функцию `lint`. Эта функция должна одинаково работать в браузере и Node.JS. Для работы линтера не должны требоваться внешние зависимости, находящиеся вне файла `linter.js`.

Мы не ограничиваем вас в выборе технологий, фреймворков и библиотек. Пожалуйста, для каждого выбранного инструмента напишите краткое обоснование: зачем он нужен в вашем проекте, и почему именно он.

### Формат входных и выходных данных

Линтер получает на вход строку `string`, которая описывает структуру блоков интерфейса в формате JSON. Формат описания блоков такой же, как в первом задании. Например:

```js
const json = `{
    "block": "warning",
    "content": [
        {
            "block": "placeholder",
            "mods": { "size": "m" }
        },
        {
            "elem": "content",
            "content": [
                {
                    "block": "text",
                    "mods": { "size": "m" }
                },
                {
                    "block": "text",
                    "mods": { "size": "l" }
                }
            ]
        }
    ]
}`;
```

На выходе линтер должен выдавать массив ошибок. Каждый элемент массива должен описывать одну ошибку (нарушение правила), и у него должны быть поля:

- `error` — текст ошибки; для каждого правила выберите текст ошибки на свое усмотрение;
- `code` — код ошибки; указан для каждого правила в его описании;
- `location` — информация о положении ошибочного блока в исходной строке. В поле `location` должны быть поля `start` и `end`, каждое из которых содержит номер строки и символа в ней. Нумерация строк и символов начинается с 1.

Для указанного выше примера результат работы линтера будет таким:

```json
[
    {
        "code": "WARNING.TEXT_SIZES_SHOULD_BE_EQUAL",
        "error": "Тексты в блоке warning должны быть одного размера",
        "location": {
            "start": { "column": 1, "line": 1 },
            "end": { "column": 2, "line": 22 }
        }
    }
]
```

Если ошибок нет, линтер должен вернуть пустой массив.

### Проверка автотестами

Чтобы уменьшить нагрузку на преподавателей, которые будут оценивать задания, мы хотим предварительно проверить решения автотестами. Если ваше решение не прошло автотесты, оно вернется на доработку и не дойдет до ручной проверки.

**Для автотестов важна файловая структура вашего репозитория и формат входных и выходных данных. Пожалуйста, в точности выполните требования, указанные выше!**

## Style guide

### Правила линтинга блока `warning`

1. Все тексты (блоки text) в блоке warning должны быть одного размера, то есть c одинаковым значением модификатора size, и этот размер должен быть определен. Размер первого из таких элементов в форме будем считать эталонным. Например:

    ```js
    {
        "block": "warning",
        // правильно
        "content": [
            { "block": "text", "mods": { "size": "l" } },
            { "block": "text", "mods": { "size": "l" } }
        ]
        // неправильно
        "content": [
            { "block": "text", "mods": { "size": "l" } },
            { "block": "text", "mods": { "size": "m" } }
        ]
    }
    ```

    **Код ошибки**: `WARNING.TEXT_SIZES_SHOULD_BE_EQUAL`  
    **Позиция ошибки**: в качестве позиций `start` и `end` необходимо указать позицию первого и последнего символов ошибочного блока `warning` в строке.

2. Размер кнопки блока `warning` должен быть на 1 шаг больше эталонного (например, для размера `l` таким значением будет `xl`).

    ```js
    {
        "block": "warning",
        "content": [
            { "block": "text", "mods": { "size": "l" } },
            // правильно
            { "block": "button", "mods": { "size": "xl" } }
            // неправильно
            { "block": "button", "mods": { "size": "s" } }
        ]
    }
    ```

    **Код ошибки**: `WARNING.INVALID_BUTTON_SIZE`  
    **Позиция ошибки**: в качестве позиций `start` и `end` необходимо указать позицию первого и последнего символов ошибочного блока `button` в строке.
    
3.  Блок `button` в блоке `warning` не может находиться перед блоком `placeholder` на том же или более глубоком уровне вложенности.

    ```js
    {
        "block": "warning",
        "content": [
            // правильно
            { "block": "placeholder", "mods": { "size": "m" } },
            { "block": "button", "mods": { "size": "m" } }
            // неправильно
            { "block": "button", "mods": { "size": "m" } },
            { "block": "placeholder", "mods": { "size": "m" } }
        ]
    }
    ```
    
    **Код ошибки**: `WARNING.INVALID_BUTTON_POSITION`  
    **Позиция ошибки**: в качестве позиций `start` и `end` необходимо указать позицию первого и последнего символов ошибочного блока `button` в строке.
    
    
4.  Допустимые размеры для блока `placeholder` в блоке `warning` (значение модификатора `size`): `s`, `m`, `l`.

    ```js
    {
        "block": "warning",
        "content": [
            // правильно
            { "block": "placeholder", "mods": { "size": "m" }
            // неправильно
            { "block": "placeholder", "mods": { "size": "xl" }
        ]
    }
    ```
    
    **Код ошибки**: `WARNING.INVALID_PLACEHOLDER_SIZE`  
    **Позиция ошибки**: в качестве позиций `start` и `end` необходимо указать позицию первого и последнего символов ошибочного блока `placeholder` в строке.

### Правила линтинга заголовков на странице

1. Заголовок первого уровня (блок `text` с модификатором type `h1`) на странице должен быть единственным.

    ```js
    [
        {
            "block": "text",
            "mods": { "type": "h1" }
        },

        // неправильно
        {
            "block": "text",
            "mods": { "type": "h1" }
        }
    ]
    ```

    **Код ошибки**: `TEXT.SEVERAL_H1`  
    **Позиция ошибки**: в качестве позиций `start` и `end` необходимо указать позицию первого и последнего символов ошибочного заголовка.

2. Заголовок второго уровня (блок `text` с модификатором type `h2`) не может находиться перед заголовком первого уровня на том же или более глубоком уровне вложенности.

    ```js
    [
        // неправильно
        {
            "block": "text",
            "mods": { "type": "h2" }
        },
        {
            "block": "text",
            "mods": { "type": "h1" }
        }
    ]
    ```

    **Код ошибки**: `TEXT.INVALID_H2_POSITION`  
    **Позиция ошибки**: в качестве позиций `start` и `end` необходимо указать позицию первого и последнего символов ошибочного заголовка.

3. Заголовок третьего уровня (блок `text` с модификатором type `h3`) не может находиться перед заголовком второго уровня на том же или более глубоком уровне вложенности.

    ```js
    [
        // неправильно
        {
            "block": "text",
            "mods": { "type": "h3" }
        },
        {
            "block": "text",
            "mods": { "type": "h2" }
        }
    ]
    ```

    **Код ошибки**: `TEXT.INVALID_H3_POSITION`  
    **Позиция ошибки**: в качестве позиций `start` и `end` необходимо указать позицию первого и последнего символов ошибочного заголовка.

### Правила линтинга пропорции функциональных и рекламных блоков
Все контентные блоки в интерфейсе можно разделить на два типа:

* Информационно-функциональные:
`payment`, `warning`, `product`, `history`, `cover`, `collect`, `articles`, `subscribtion`, `event`;

* Маркетинговые:
`commercial`, `offer`.

Нужно проверить, что маркетинговые блоки занимают не больше половины от всех колонок блока `grid`. Считается, что одну колонку может занимать только один из вышеописанных блоков.
 
```js
{
   "block": "grid",
   "mods": {
       "m-columns": "10"
   },
   // правильно
   "content": [
       {
           "block": "grid",
           "elem": "fraction",
           "elemMods": {
               "m-col": "8"
           },
           "content": [
               {
                   "block": "payment"
               }
           ]
       },
       {
           "block": "grid",
           "elem": "fraction",
           "elemMods": {
               "m-col": "2"
           },
           "content": [
               {
                   "block": "offer"
               }
           ]
       }
   ]
   // неправильно
   "content": [
       {
           "block": "grid",
           "elem": "fraction",
           "elemMods": {
               "m-col": "2"
           },
           "content": [
               {
                   "block": "payment"
               }
           ]
       },
       {
           "block": "grid",
           "elem": "fraction",
           "elemMods": {
               "m-col": "8"
           },
           "content": [
               {
                   "block": "offer"
               }
           ]
       }
   ]
}
```
       
**Код ошибки**: `GRID.TOO_MUCH_MARKETING_BLOCKS`  
**Позиция ошибки**: в качестве позиций `start` и `end` необходимо указать позицию первого и последнего символов ошибочного блока `grid`.
