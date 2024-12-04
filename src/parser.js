export default (data) => {
  const newParser = new DOMParser();
  const newData = newParser.parseFromString(data, 'application/xml');
  const parsererror = newData.querySelector('parsererror');
  if (parsererror) {
    const error = new Error(parsererror.textContent);
    error.isParserError = true;
    throw error;
  }
  const title = newData.querySelector('channel title').textContent;
  const description = newData.querySelector('channel description').textContent;
  const items = newData.querySelectorAll('item');
  const list = Array.from(items);
  const posts = list.map((item) => ({
    title: item.querySelector('title').textContent,
    description: item.querySelector('description').textContent,
    link: item.querySelector('link').textContent,
  }));

  return [title, description, posts];
};
