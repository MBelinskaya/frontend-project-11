export default (data) => {
  const newParser = new DOMParser();
  const newData = newParser.parseFromString(data, 'application/xml');
  const parsererror = newData.querySelector('parsererror');
  if (parsererror) {
    const error = new Error(parsererror.textContent);
    error.isParserError = true;
    throw error;
  }
  const feedTitle = newData.querySelector('channel title').textContent;
  const feedDescription = newData.querySelector('channel description').textContent;
  const parsedData = {
    title: feedTitle,
    description: feedDescription,
  };
  const items = newData.querySelectorAll('item');
  const list = Array.from(items);
  const parsedItems = list.map((item) => ({
    title: item.querySelector('title').textContent,
    description: item.querySelector('description').textContent,
    link: item.querySelector('link').textContent,
  }));
  return [parsedData, parsedItems];
};
