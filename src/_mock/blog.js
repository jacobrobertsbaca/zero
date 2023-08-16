import { faker } from '@faker-js/faker';

// ----------------------------------------------------------------------

const POST_TITLES = [
  '✨ Summer Internship ✨',
  'Winter Break',
  '2023 Fall'
];

function fakeProgress() {
  const total = faker.datatype.number();
  return {
    progress: faker.datatype.number({
      min: 0,
      max: total
    }),
    total
  }
}

const posts = [...Array(3)].map((_, index) => ({
  id: faker.datatype.uuid(),
  cover: `/assets/images/covers/cover_${index + 1}.jpg`,
  title: POST_TITLES[index],

  startDate: faker.date.past(),
  endDate: faker.date.past(),
  ...(fakeProgress())
}));

export default posts;
