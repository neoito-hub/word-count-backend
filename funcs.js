let wordFreq = string => {
  let words = string.replace(/[.]/g, "").split(/\s/);
  words = words
    .map(w => {
      let newWord = w.replace(/[^\w]/g, "");
      return newWord;
    })
    .filter(w => w !== "");

  // console.log(words);
  let wordMap = {};
  words.forEach(function(w) {
    if (!wordMap[w]) {
      wordMap[w] = 0;
    }
    wordMap[w] += 1;
  });
  return wordMap;
};

let makeMap = arr => {
  let obj = {};
  arr.forEach(function(w) {
    obj[w.word] = w["frequency"];
  });
  return obj;
};

module.exports = {
  wordFreq,
  makeMap
};
