const express = require('express');
const cors = require('cors');
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const extractMainUrl = (inputUrl) => {
  const mainUrl = inputUrl.split('@')[0];
  return mainUrl;
};

const getRedirectUrl = async (url) => {
  try {
    const response = await axios.get(url);
    return response.request.res.responseUrl;
  } catch (error) {
    console.error(`Error fetching redirect URL: ${error}`);
    throw error;
  }
};

const fetchJsFile = async (redirectUrl) => {
  try {
    const response = await axios.get(redirectUrl);
    return response.data;
  } catch (error) {
    console.error(`Error fetching JS file: ${error}`);
    throw error;
  }
};

const extractImports = (jsFileContent) => {
  const importRegex = /import[^;]+;/g;
  const imports = jsFileContent.match(importRegex);
  return imports ? imports.join('\n') : '';
};

const modifyUrlToTsx = (url) => {
  return url.replace('.js', '.tsx');
};

const fetchTsxFile = async (url) => {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(`Error fetching TSX file: ${error}`);
    throw error;
  }
};

const replaceImportsInTsx = (tsxFileContent, jsImports) => {
  const modifiedTsxContent = tsxFileContent.replace(/import[^;]+;/g, jsImports);
  return modifiedTsxContent;
};

app.post('/reencode', async (req, res) => {
  const { inputUrl } = req.body;
  try {
    const mainUrl = extractMainUrl(inputUrl);
    const redirectUrl = await getRedirectUrl(mainUrl);
    const jsFileContent = await fetchJsFile(redirectUrl);
    const jsImports = extractImports(jsFileContent);
    const tsxUrl = modifyUrlToTsx(mainUrl);
    const tsxFileContent = await fetchTsxFile(tsxUrl);
    const modifiedTsxContent = replaceImportsInTsx(tsxFileContent, jsImports);
    const fileName = 'ModifiedComponent.tsx';
    fs.writeFileSync(fileName, modifiedTsxContent, 'utf8');
    res.json({
      message: 'File re-encoded successfully',
      fileName,
      content: modifiedTsxContent,
    });
  } catch (error) {
    console.error(`Error in processing: ${error}`);
    res.status(500).json({ error: 'An error occurred during processing' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
