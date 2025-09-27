import { caseStudyPDFs } from "./RouteConstants";

export const caseStudies = [
  {
    id: "Harvard Medical School",
    logoimage: "/casestudy_logos/Harvard.png",
    image: "/casestudy_photo/Harvard.png",
    backgroundColor: "bg-blue-900",
    category: "Extracting Entities",
    problem:
      "Clockbase's longevity dataset needed conversion from one semi-structured format to another. Manually carrying out this conversion was not feasible due to the large volume of data and the intensive labor and time required.",
    solution:
      "Anote implemented an automated solution that involved data preprocessing, programmatic labeling, domain specific GPT-3 prompting, and integration with GPT-4 for structured output conversion.",
    result:
      "Through the combined use of programmatic labels and GPT integration, we were able to automate the data cleaning process. This automation not only saved valuable time and cost but also ensured high accuracy in the generated predictions.",
    docUrl: caseStudyPDFs["/customers/harvard"],
    title:
      "Preprocessing Structured Data with Gen AI to Enhance Longevity Research",
    industry: "Healthcare",
    description: "Extracting Structured Entities",
    insights: [
      { number: "2,424", text: "Unique identifiers analyzed" },
      { number: "205,591", text: "Rows of metadata converted" },
      { number: "2,672,683", text: "Data cells labeled" },
    ],
    metadata: [
      {
        type: "h1",
        content: "Background",
      },
      {
        type: "p",
        content:
          "Harvard University is at the forefront of exploring longevity, with an aim to extend human lifespan. Aging remains the leading risk factor for chronic diseases and mortality. To understand it comprehensively, there\u2019s a need to measure biological age accurately.",
      },
      {
        type: "p",
        content:
          "Several machine learning algorithms, termed aging clocks, have been developed that can predict the age of biological samples based on omics data. However, a systematic resource for profiling biological age is still lacking. Enter, ClockBase.",
      },
      {
        type: "h1",
        content: "ClockBase: A Comprehensive Aging Clock",
      },
      {
        type: "p",
        content:
          "ClockBase is a comprehensive platform that integrates multiple aging clock models, including epigenetic clocks for humans and mice. It profiles the biological age of samples derived from diverse tissues, cell types, and even single cells.",
      },
      {
        type: "p",
        content:
          "ClockBase curates the 11 top-performing aging clock models and applies them to over 2,000 publicly available DNA methylation datasets from resources like the Gene Expression Omnibus (GEO). It comprises biological age data for roughly 200,000 samples in both mice and humans. Furthermore, researchers can upload their own data for biological age calculation. The platform offers an interactive analysis tool for statistical analyses and visualization of biological age data.",
      },
      {
        type: "p",
        content:
          "By leveraging ClockBase, researchers can explore biological age in different samples, discover new longevity interventions, and identify age-accelerating conditions. This significantly contributes to the scientific community\u2019s understanding of aging.",
      },
      {
        type: "h1",
        content: "Problem: Data Conversion",
      },
      {
        type: "p",
        content:
          "During the course of the research, a dataset was encountered which needed conversion from one structured format to another. Manually carrying out this conversion was not feasible due to the large volume of data and the intensive labor and time required.",
      },
      {
        type: "h1",
        content: "Dataset",
      },
      {
        type: "p",
        content:
          "The original dataset encompassed 2,424 unique identifiers, each containing the following types of files:",
      },
      {
        type: "ul",
        content: [
          "Desc file: This file included a ‘description’ and a ‘summary’ of the unique identifier.",
          "Meta file: This was a CSV file containing specific medical data under different columns.",
          "Target file: This file specified the desired column structure for the output CSV file.",
        ],
      },
      {
        type: "p",
        content:
          "Here are the target columns which we would like to predict the output for:",
      },
      {
        type: "p",
        content:
          'TARGET_COLUMNS = [\n"GSM_ID",\n"race",\n"sex",\n"age",\n"genetic_info",\n"disease",\n"tissue",\n"cell_line",\n"vivo_vitro",\n"case_control",\n"group_name",\n"treatment",\n"perturbation_category"\n]',
      },

      {
        type: "p",
        content:
          "In total, there are 205,591 rows of df_meta data, so each of the 2,424 datasets has on average 85 rows. Given that there are 13 target columns per row of data, there are 2,672,683 cells of data that we would need to manually label. Given the volume of data, leveraging a manual approach to label data in a spreadsheet would take months to years, cost a lot of money, and would be inefficient and unscalable.",
      },
      {
        type: "h1",
        content:
          "Solution: Automated Data Conversion using Programmatic Labeling Functions, GPT-3 and GPT-4",
      },
      {
        type: "p",
        content:
          "To tackle the challenge of converting the dataset, we implemented an automated solution that involved programmatic labels and integration with GPT-3 and GPT-4.",
      },
      {
        type: "h1",
        content: "Programmatic Labels",
      },
      {
        type: "p",
        content:
          "We developed programmatic labeling functions to automate the extraction and categorization of information from the dataset. These functions allowed us to identify specific columns and categories based on heuristic entities",
      },
      {
        type: "p",
        content:
          "By leveraging these programmatic labels, we automated the process of extracting relevant information and populating the target columns.",
      },
      {
        type: "h1",
        content: "GPT-3 Integration for Data Conversion",
      },
      {
        type: "p",
        content:
          "We integrated GPT-3, a powerful language model, to generate predictions for specific columns in the dataset. By prompting GPT-3 with relevant information, we obtained accurate predictions for columns such as perturbation category and tissue. Here are examples of functions using GPT-3 integration:",
      },
      {
        type: "p",
        content:
          "GPT-3 integrated functions played a crucial role in automating the data conversion process and ensuring accurate predictions for specific columns.",
      },
      {
        type: "h1",
        content: "GPT-4 Integration",
      },
      {
        type: "p",
        content:
          "We leveraged the capabilities of GPT-4, a powerful language model, to generate predictions based on the training data. The integration with GPT-4 enabled us to automate the data type conversion process. Here is an example of how GPT-4 integration was used for data conversion:",
      },
      {
        type: "p",
        content:
          "Through this automated method, the conversion of the large dataset became feasible and efficient, driving the longevity research further and enabling the scientists to focus on core research tasks.",
      },
      {
        type: "h1",
        content: "Results",
      },
      {
        type: "p",
        content:
          "Through the combined use of programmatic labels, GPT-3 integration, and GPT-4 integration, we were able to automate the conversion of the large dataset. This automation not only saved valuable time and cost but also ensured high accuracy in the generated predictions.",
      },
      {
        type: "p",
        content:
          "The successful outcome of the solution allowed the team to leverage the algorithm for training a model via clock-based to explore the possibility of extending human life. This research has the potential to bring significant benefits to society.",
      },
    ],
  },
  {
    logoimage: "/casestudy_logos/Ship Index.png",
    id: "ShipIndex",
    backgroundColor: "bg-yellow-800",
    image: "/casestudy_photo/ShipIndex.png",
    docUrl: caseStudyPDFs["/customers/shipindex"],
    category: "Extracting Entities",
    metadata: [
      {
        type: "h2",
        content: "Background",
      },
      {
        type: "p",
        content:
          "Ship Index, based in Ithaca, NY, specializes in identifying vessels in text data. Their platform, ShipIndex.org, provides a database of maritime resources, including books, journals, magazines, newspapers, CD-ROMs, websites, and online databases. This platform makes vessel research easy by enhancing these resources with additional information like illustrations, crew and passenger lists, and resource availability.",
      },
      {
        type: "h2",
        content: "Challenge",
      },
      {
        type: "p",
        content:
          "Ship Index wanted us to ideally be able to extract every single ship name from all sublinks (approximately 3,500 web pages) of the https://www.theshipslist.com/ site. It turns out that vessel names are not mutually exclusive with respect to people\u2019s names and the names of locations. In other words, there are ship names that could be named after people and also cities, states, or countries. Thus, filtering out locations and people could also filter out important ship names. Furthermore, the vessel names are also embedded within many different parts of the web page such as tables, paragraphs, headings, captions etc. and therefore, detecting ship names is not unique to a particular format. The lack of a structured index hindered efficient ship research and posed difficulties for individuals seeking specific ship information.",
      },
      {
        type: "h2",
        content: "Solution",
      },
      {
        type: "p",
        content:
          "ShipIndex adopted a solution comprising web crawling, using OpenAI\u2019s GPT-3 for name extraction, post-processing, and refinement, and establishing a URL-Ship Name association.",
      },
      {
        type: "h1",
        content: "Web Crawling with Apache Tika:",
      },
      {
        type: "p",
        content:
          "The first part of the code involves gathering data from the website using web scraping techniques. The requests library is used to send HTTP requests, and BeautifulSoup is used to parse the HTML content of the pages. The tika parser is used to extract text from the HTML content.",
      },
      {
        type: "p",
        content:
          "GPT-3 Ship Name Extraction: Next, GPT-3, an advanced language model developed by OpenAI, was used to analyze the text data from the ShipsList website. GPT-3 was tasked with identifying ship names within the text. Here is how it worked:",
      },
      {
        type: "p",
        content:
          "1. Processing loop: The script then enters a loop, where each iteration handles a single row (URL and its corresponding text) from the CSV file.",
      },
      {
        type: "p",
        content:
          "2. Chunking: It splits the text content into smaller chunks with a maximum of 2800 tokens each (as there is a limit on the maximum number of tokens that can be processed in a single request by the OpenAI API).",
      },
      {
        type: "p",
        content:
          "3. Call GPT-3 / Claude Model: For each chunk, the script sends a request to the OpenAI API, or the Claude API, instructing the AI model to “Find all the names of ships here. Output as a csv, and only the csv. Do not output peoples names or destinations: {selected_text}”. This is asking the model to identify ship names from the provided text (selected_text)",
      },
      {
        type: "p",
        content:
          "4. Convert to DataFrame: A temporary DataFrame is created to hold these ship names along with the corresponding URL. This temporary DataFrame is then appended to a main DataFrame (shiplist_df) for accumulating all ship names across all text chunks within the URL.",
      },
      {
        type: "p",
        content:
          "5. Output: After processing each URL and its corresponding text, the collected ship names are written out to a CSV file named with the current count. The CSV file is stored in the ‘output’ directory.",
      },
      {
        type: "h1",
        content: "Post-processing and Refinement",
      },
      {
        type: "p",
        content:
          "After obtaining the initial extraction results, Ship Index implemented post-processing techniques to refine these results. These techniques included filtering out false positives, handling variations in ship name representations, and ensuring reliable ship name identification, thus improving the accuracy of the results.",
      },
      {
        type: "p",
        content:
          "1. Dropping duplicates and unnecessary columns: Initially, the code loads the CSV file into a DataFrame and drops duplicate rows based on \u201curl\u201d and \u201cship_name\u201d and then removes unwanted column names.",
      },
      {
        type: "p",
        content:
          "2. Removing multiple entries for the same URL: If the same URL appears multiple times in the \u201cpassenger lists\u201d category, all but the first appearance are dropped.",
      },
      {
        type: "p",
        content:
          "3. Cleaning the \u2018ship_name\u2019 column: The script drops rows if the \u201cship_name\u201d field is a certain type (float), contains certain substrings (e.g., \u201cN/A\u201d, \u201cMr.\u201d, \u201cMrs.\u201d, etc.), or has a certain length or number of words. This is to remove irrelevant or incorrect ship names.",
      },
      {
        type: "p",
        content:
          "4. Replacing and formatting strings: The code then goes through and replaces certain characters and phrases in the \u201cship_name\u201d column. It also removes any leading or trailing numbers or punctuation and removes any rows where the ship name is blank.",
      },
      {
        type: "p",
        content:
          "5. Removing rows based on named entities: The code then uses the SpaCy library to remove rows where the ship name is recognized as a person\u2019s name (based on SpaCy\u2019s named entity recognition). It then does the same for locations.",
      },
      {
        type: "p",
        content:
          "Modifications: One of the first major changes we came up with for the above solution was modifying the prompt provided to ChatGPT to give a little more information on how to identify names of ships. For instance, in our prompt we noted that \u201cthe name of the ship can be located at the beginning of the scraped text, where it precedes a description of its voyage. For example, the ship name in the following text is \u2018Caledonia\u2019: Caledonia \u2014 26th trip up, Quebec to Montreal 29th October 1822. It can also be located in a table of a webpage underneath the column \u2018Vessel\u2019 or \u2018Ship Name\u2019.\u201d This was to clear up any ambiguities between ships and other categories. We had also utilized the Bard API by utilizing a token obtained from the JavaScript console. However, after multiple attempts to use it, we got rate limited and kept getting error messages for our request responses. After utilizing ChatGPT\u2019s API and Bard\u2019s API, we looked into using Google\u2019s Bard API and then Claude, the LLM developed by Anthropic. Claude seemed more useful in the sense that we had a much larger context window with which we could extract more information from the text scraped from the webpage.",
      },
      {
        type: "h3",
        content: "GPT3 Results: Before Post-processing",
      },
      {
        type: "ul",
        content: [
          "3,150 URLs processed",
          "181,182 citations extracted",
          "Average of 57 citations per URL",
        ],
      },
      {
        type: "h3",
        content: "After Post-processing",
      },
      {
        type: "ul",
        content: [
          "2,842 URLs processed",
          "111,028 citations remaining after refinement",
          "Average of 35 citations per URL",
        ],
      },
      {
        type: "p",
        content:
          "In total, we identified 57,733 unique ships in shipslist that otherwise would have gone unnoticed. Claude Results on non-passenger list URLs: Before Post-processing (has duplicates)",
      },
      {
        type: "ul",
        content: [
          "1270 URLs processed",
          "85,742 citations extracted",
          "Average of 67 citations per URL",
          "33989 unique ships identified",
        ],
      },
      {
        type: "h3",
        content: "After Post-processing",
      },
      {
        type: "ul",
        content: [
          "1243 URLs processed",
          "63,884 citations remaining after refinement",
          "Average of 51 citations per URL",
          "32449 unique ships identified",
        ],
      },
      {
        type: "h2",
        content: "Conclusion",
      },
      {
        type: "p",
        content:
          "By leveraging Apache Tika for web crawling, OpenAI\u2019s GPT-3 for ship name extraction, and implementing post-processing techniques, Ship Index successfully created a structured index of ship names from the ShipsList website. This solution significantly enhanced ship research capabilities by providing researchers with an organized and easily accessible resource for locating specific ship information.",
      },
    ],
    problem:
      "ShipIndex wanted to scrape all of the links, sublinks and subsublinks in the ShipsList website, which contains approximately 3,500 web pages with numerous mentions of ships. From parsing the ShipsList web pages, ShipIndex wanted to extract ship names, and create a structured index for their ship database.",
    solution:
      "ShipIndex adopted a solution comprising web crawling, using OpenAI’s GPT-3 for name extraction, post-processing, and refinement, and establishing a URL-Ship Name association. This enabled ShipIndex to extract ship names could appear in different formats, including bold text, tables, capitalized words, or plain text.",
    result:
      "By leveraging Apache Tika for web crawling, OpenAI’s GPT-3 for ship name extraction, and implementing post-processing techniques, ShipIndex successfully created a structured index of ship names from the ShipsList website. This enhanced ship research capabilities by providing an accessible resource for locating ship information.",
    title: "Identifying Ship Names in Websites with Claude and GPT3",
    industry: "Maritime",
    description: "Named Entity Recognition",
    insights: [
      { number: "1,270", text: "distinct URLs processed" },
      { number: "205,591", text: "Rows of metadata converted" },
      { number: "2,672,683", text: "Data cells labeled" },
    ],
  },
  {
    logoimage: "/casestudy_logos/Rutgers.png",
    id: "Rutgers",
    image: "/casestudy_photo/Rutgers.png",
    backgroundColor: "bg-red-900",
    insights: [
      { number: "80%", text: "Accuracy Increase" },
      { number: "3 months", text: "Time required for manual analysis" },
      { number: "1 day", text: "Time required using automated solution" },
    ],
    metadata: [
      {
        type: "h1",
        content: "Introduction",
      },
      {
        type: "p",
        content:
          "Here, we delve into a scenario where a legal expert, Mia, seeks to access deep insights from a large collection of legal case studies. This is what a case study looks like on Anote.",
      },
      {
        type: "p",
        content:
          "Mia had 500 documents, each on average 15 to 25 pages, and she had the following questions she wanted to answer on this document:",
      },
      {
        type: "ul",
        content: [
          "What is the date of the appellate case?",
          "What is the title of the document?",
          "What is the jurisdiction of the case?",
          "Which court handled the appeal?",
          "Which court handled the original trial and sentencing?",
          "What was the date of the original sentencing?",
          "Was the original judgement affirmed?",
          "What is the gender of the judge handling the appeal?",
          "What is the name of the judge handling the appeal?",
          "What is the gender of the original judge?",
          "What is the gender of the defendant?",
          "What is the age of the defendant?",
          "Does the defendant have a mental disorder? If yes, provide the first disorder.",
          "Does the defendant have a second mental disorder? If yes, provide the second disorder.",
          "Are there more than two disorders?",
          "Does the defendant have a criminal history?",
          "What is the most severe charge for which the defendant was found guilty?",
          "What is the second charge or count for which the defendant was found guilty?",
          "What is the third charge or count for which the defendant was found guilty?",
          "Are there more than three charges?",
          "Did the defendant plead guilty or no contest?",
          "Was there a jury trial?",
          "Is the death penalty involved in the case?",
          "Will there be imprisonment for the defendant?",
          "If there is imprisonment, what is the length in months?",
          "Is there any institutionalization in a hospital or civil commitment?",
          "Will there be post-release supervision?",
          "If there is post-release supervision, what is the length in months?",
          "Is probation given instead of imprisonment?",
          "If there is probation, what is the length in months?",
          "Is there a rehab or treatment order?",
          "Is there a fine or restitution involved?",
        ],
      },
      {
        type: "p",
        content:
          "Initially, she went through 120 of these documents and typed the results in an excel spreadsheet, which was tedious and took over 3 months of work. She wanted to see whether AI could help automate this process, so she looked into LLMs like ChatGPT, to generate initial answers to these questions. However, due to its general nature, the model struggled to provide accurate responses for the specific legal domain. Here is an example of ChatGPT, as well as other general purpose LLMs, output:",
      },
      {
        type: "p",
        content:
          "While it would be great if we could get the model response and the citation (source document, source content) for each question we ask, unfortunately the zero shot ChatGPT LLM doesn\u2019t know a lot of the answers in the legal domain initially, so the model answers are not too helpful. As a result, Mia is still going through these documents manually, in a spreadsheet. Here is an example of what the first row of spreadsheet looks like:",
      },
      {
        type: "p",
        content:
          "Mia is looking for a better way to use LLMs to help here, and went to Anote for assistance.",
      },
      {
        type: "h1",
        content: "Problem Statement",
      },
      {
        type: "p",
        content:
          "The problem statement is to create an effective, AI-enabled solution that not only provides accurate answers to complex legal questions but also continually improves its performance with human feedback, thereby unlocking crucial data currently beyond reach, conserving resources, and reducing costs. With high quality model results, we would be able to streamline the process of manually reviewing and extracting information from the 120 long legal documents, thereby reducing the time and making the process less tedious.",
      },
      {
        type: "h1",
        content: "Proposed Solution",
      },
      {
        type: "h3",
        content: "Section: Data Split and Initial Evaluation",
      },
      {
        type: "p",
        content:
          "To ensure the effectiveness of our legal question answering system, we divided our dataset into training data and testing data. We used a total of 120 legal documents for this study, with 20 documents reserved for testing purposes and 100 documents used for training. The testing data, consisting of the 20 selected legal documents, served as our evaluation set.",
      },
      {
        type: "h3",
        content: "Initial Predictions:",
      },
      {
        type: "p",
        content:
          "We initiated the process by using ChatGPT\u2019s zero-shot capabilities to generate preliminary answers for the legal questions present in all of the documents in the testing dataset. We employed the initial zero-shot predictions from ChatGPT to generate answers for the following 6 questions on the testing data:",
      },
      {
        type: "ul",
        content: [
          "What was the gender of the appeal judge? Please answer \u2018m\u2019 for male and \u2018f\u2019 for female.",
          "What was the gender of the defendant? Please answer \u2018m\u2019 for male and \u2018f\u2019 for female.",
          "What was the first most severe charge for which the defendant was found guilty?",
          "What was the jurisdiction? Please provide the initials of the jurisdiction.",
          "Did the defendant have any history of criminal activity? Please answer \u2018yes\u2019 or \u2018no\u2019.",
          "What was the second charge for which the defendant was found guilty?",
        ],
      },
      {
        type: "h3",
        content: "Human Feedback Integration:",
      },
      {
        type: "p",
        content:
          "Expert legal practitioners meticulously reviewed the model\u2019s initial answers on the first training document and provided feedback on any inaccuracies or deficiencies they identified. This feedback was recorded and used to improve the model\u2019s subsequent performance.",
      },
      {
        type: "h2",
        content: "Fine-tuning:",
      },
      {
        type: "p",
        content:
          "With the obtained feedback on the first document, we incorporated it into the training data and fine-tuned the model using the feedback-inclusive prompts. This fine-tuning process aimed to enhance the model\u2019s understanding and accuracy on the specific legal questions within the first document. Through this process, the model is equipped with capabilities to access insights from legal documents, capabilities it initially lacked, marking a significant evolution in its learning process.",
      },
      {
        type: "h2",
        content: "Repetition for Subsequent Documents:",
      },
      {
        type: "p",
        content:
          "We repeated the above process for each subsequent document in the training dataset. This iterative approach allowed us to accumulate feedback and progressively refine the model\u2019s performance with each document review. By integrating human feedback and iteratively fine-tuning the model, we observed a progressive improvement in the accuracy and quality of the answers provided by the system.",
      },

      {
        type: "h3",
        content: "Results",
      },
      {
        type: "p",
        content:
          "To evaluate our approach, we employed a pre-defined evaluation set comprising 25 groups, with approximately 6 questions in each group. For each training document we added feedback for we would evaluate the feedback on 25 testing dataset documents.",
      },
      {
        type: "p",
        content:
          "The model is equipped with capabilities to access insights from legal documents, capabilities it initially lacked, marking a significant evolution in its learning process.",
      },
      {
        type: "h2",
        content: "Tutorial Video:",
      },
      {
        type: "p",
        content:
          "Here is a tutorial video explain how the Anote product is designed to improve generative AI models with the input of subject matter expertise.",
      },
      {
        type: "p",
        content: "https://www.loom.com/share/d6cb3dd6daa34f24ac8fa231fbeaa6be",
      },
      {
        type: "h1",
        content: "Private vs. Public LLMs",
      },
      {
        type: "p",
        content:
          "We are able to obtain these results with both private, on premise LLMs like Llama and GPT4 All, as well as public LLMs like OpenAI. This is important in the case where you have sensitive data that you want to keep secure, but would like to leverage LLMs and generative AI to improve your workflow.",
      },
      {
        type: "h2",
        content: "Impact",
      },
      {
        type: "p",
        content:
          "The impact of our solution was remarkable, significantly reducing the time and effort required for manual review and extraction of information from the 120 lengthy legal documents. The automated nature of our approach saved legal practitioners from the painstaking task of manually scrutinizing each document and entering answers into a spreadsheet. But our solution\u2019s impact extends beyond just remarkable time-saving. It revolutionizes the way legal data is processed, providing access to crucial insights that were previously buried in mountains of paperwork, thus remaining virtually untapped due to the prohibitive time and resource requirements of manual review. Via leveraging human feedback to enhance the model\u2019s understanding of the legal domain, we achieved higher accuracy in legal question answering, resulting in increased efficiency and productivity.",
      },
    ],
    category: "Extracting Entities",
    docUrl: caseStudyPDFs["/customers/rutgers"],
    title: "Enhancing Legal Question Answering with Human Feedback",
    industry: "Legal Tech",
    problem:
      "Traditionally, answering legal questions from multiple documents is time-consuming and cost-intensive. Mia tried using LLMs like ChatGPT, but it struggled to provide accurate responses for the specific legal domain.",
    solution:
      "Fine-tuning was applied to the model using feedback from the first document. The model was then used to extract answers from the remaining documents. The fine-tuning process equipped the model with the capabilities to extract insights from legal documents, a capability it initially lacked.",
    result:
      "The application of human feedback improved the model's performance in extracting data from the legal documents, thus unlocking crucial insights and making the process less tedious.",
    description: "Retrieval Augmented Generation",
  },
  {
    logoimage: "/casestudy_logos/Hardy Riggings.png",
    id: "HardyRiggings",
    image: "/casestudy_photo/Hardy Riggings.png",
    backgroundColor: "bg-green-900",
    insights: [
      { number: "79", text: "URLs processed" },
      { number: "474", text: "Types cells information extracted" },
      { number: "98%", text: "Accuracy of predictions" },
    ],
    category: "Answering Questions",
    docUrl: caseStudyPDFs["/customers/hardy-riggings"],
    title: "Data Scraping for Hardy Riggings",
    industry: "E-Commerce",
    problem:
      "Manually extracting data from 79 product web pages is time-consuming. Searching for product titles, descriptions, variants, prices, product manuals and spec sheets by hand is tedious, so Hardy Riggings was looking for a way to automate this process.",
    solution:
      "Anote used apache 'tika' to retrieve content from each URL. Anote chunked the text from each URL, converted the text into embeddings, and prompted an AI model with specific questions for each URL to extract information in a CSV file.",
    result:
      "The generated CSV file contains the predicted information extracted from each URL associated with Hardy Riggings. The CSV format was compatibile with WooCommerce, facilitating seamless importation of the extracted data into their platform.",
    description: "Semi-Structured Prompting",
    metadata: [
      {
        type: "h1",
        content: "Introduction",
      },
      {
        type: "p",
        content:
          "In this case study, we will explore the process of scraping data from 79 URLs associated with Hardy Riggings. Our objective is to extract valuable information such as product titles, descriptions, variants, prices, product manuals and certifications, and spec sheets. The extracted data will be formatted into a CSV file suitable for importing into WooCommerce, a popular WordPress plugin for e-commerce.",
      },
      {
        type: "h1",
        content: "Approach",
      },
      {
        type: "p",
        content: "To achieve our goal, we followed the following steps:",
      },
      {
        type: "h1",
        content: "1. Scraping Text from URLs",
      },
      {
        type: "p",
        content:
          "We utilized the Python library \u201ctika\u201d along with the \u201crequests\u201d module to retrieve the content from each URL. By using Apache Tika, we ensured proper handling of various document formats",
      },
      {
        type: "h1",
        content: "2. Chunking Text and Generating",
      },
      {
        type: "p",
        content:
          "The text obtained from each URL was chunked and converted into embeddings. This step helps provide context to the AI model, enabling it to generate more accurate predictions.",
      },
      {
        type: "p",
        content:
          "chunks = create_chunks(text, n=1000, tokenizer=tokenizer)  text_chunks = [tokenizer.decode(chunk) for chunk in chunks]",
      },
      {
        type: "p",
        content:
          "response = openai.Embedding.create(  input=text,  model=\"text-embedding-ada-002\"  )  embeddings = response['data'][0]['embedding']",
      },
      {
        type: "h1",
        content: "3. Prompting the Model for Information Extraction",
      },
      {
        type: "p",
        content:
          "We prompted an AI model with specific questions for each URL to extract the desired information. The questions we asked for each URL were:",
      },
      {
        type: "ul",
        content: [
          "PRODUCT TITLE: What is the product title?\n\n",
          "PRODUCT DESCRIPTION: Provide a description of the product.\n\n",
          "VARIANTS: What are the variants of the product? (Sizes with respective SKUs and prices)\n\n",
          "PRICE: What is the price of the product?\n\n",
          "PRODUCT MANUAL: Does the product have a manual or certifications? If yes, describe key points in four sentences or less.\n\n",
          "SPEC SHEET: Is there a spec sheet available? If yes, describe the key specifications.\n\n",
        ],
      },
      {
        type: "p",
        content:
          "By interacting with the AI model in this manner, we were able to extract the required information efficiently.",
      },
      {
        type: "h1",
        content: "4. CSV Output Generation",
      },
      {
        type: "p",
        content:
          "The model\u2019s responses to our prompts were compiled into a CSV file. Each row in the CSV file represents a URL, while each column corresponds to a specific question. The cells contain the AI model\u2019s predicted answers for the respective URL and question.",
      },
      {
        type: "p",
        content:
          "The generated CSV file contains the predicted information extracted from each URL associated with Hardy Riggings. The revised CSV format is compatible with WooCommerce, facilitating seamless importation of the extracted data.",
      },
      {
        type: "h1",
        content: "Conclusion",
      },
      {
        type: "p",
        content:
          "By following the outlined steps, we successfully extracted data from the 79 URLs associated with Hardy Riggings. The resulting CSV file provides a comprehensive overview of each product, including essential details such as product title, description, variants, price, product manual and certifications, and spec sheet. The accuracy and completeness of the extracted information enhance the efficiency of WooCommerce integration, enabling streamlined product management within the WordPress ecosystem.",
      },
    ],
  },
  {
    logoimage: "/casestudy_logos/GooseHollow.png",
    id: "Workflows",
    backgroundColor: "bg-lime-900",
    image: "/casestudy_photo/Workflow.png",
    title: "Creating Workflows",
    docUrl: caseStudyPDFs["/customers/workflows"],
    industry: "Financial Services",
    category: "Answering Questions",
    problem:
      "Both biotech and financial services companies face time-consuming document analysis tasks. Genentech needed to draft SBIR proposals for cancer research funding, while Morningstar analysts spent hours extracting insights from dense financial reports like 10-Ks and 10-Qs.",
    solution:
      "They implemented customizable workflows that guide users through structured questions and auto-generate tailored outputs SBIR drafts for Genentech and investor-ready financial summaries for Morningstar.",
    result:
      "Genentech accelerated their grant proposal process, allowing researchers to focus on scientific work, while Morningstar significantly reduced the time required for investment analysis, enabling faster, more informed buy/sell decisions.",
    description: "Generating Financial Reports",
    metadata: [
    {
      type: "h3",
      content: "Why it matters"
    },
    {
      type: "p",
      content:
        "Analysts and researchers spend up to 60 % of their week parsing PDFs, spreadsheets, and regulatory filings. Anote’s AI-driven workflows turn that grind into a two-click operation."
    },
    {
      type: "h3",
      content: "How the workflow works"
    },
    {
      type: "p",
      content:
        "✓ Connects to internal document stores (SharePoint, Box, S3) and public SEC feeds.\n✓ Uses retrieval-augmented generation to pull only relevant passages.\n✓ Applies domain-tuned LLMs to draft grant sections or financial narratives.\n✓ Exports polished reports to Google Docs, Word, or your BI dashboard."
    },
    {
      type: "h3",
      content: "Impact in numbers"
    },
    {
      type: "p",
      content:
        "• 6× faster report turnaround (days → hours)."
    },
        {
      type: "p",
      content:
        "• Estimated $1.2 M annual analyst-hour savings for a 25-person equity research team."
    },
            {
      type: "p",
      content:
        "• 38 % increase in deal-pipeline velocity for biotech grant writers."
    },
    {
      type: "h3",
      content: "Get started"
    },
    {
      type: "p",
      content:
        "Drag-and-drop your first 10-K or SBIR draft and watch the workflow generate an executive summary, risk analysis, and custom Q&A in under five minutes."
    }
  ]
  },
  {
    logoimage: "/casestudy_logos/Weill Cornell.png",
    id: "WeillCornell",
    category: "Answering Questions",
    image: "/casestudy_photo/WeillCornell.png",
    backgroundColor: "bg-blue-600",
    title: "Medical Document Summarization with Anote",
    problem:
      "Abstractive Health faced challenges in summarizing medical charts due to high costs, time consumption, and the need for skilled annotators. They spent an estimated $50,000 annually to summarize 10,000 charts. Their previous annotation interface, Redcap, was complex, and patient data security required an on-premise solution, making it difficult to find a suitable alternative.",
    solution:
      "Abstractive Health partnered with Anote, utilizing their annotation interface. This interface allowed users to upload medical charts, customize questions for an AI model to generate summaries, and operate the system on-premise to ensure data security.",
    result:
      "By adopting Anote, Abstractive Health achieved substantial improvements in the efficiency and cost-effectiveness of medical document summarization.",
    docUrl: caseStudyPDFs["/customers/weill-cornell"],
    industry: "Healthcare",
    description: "Summarizing Medical Charts",
    metadata: [
      { type: "h1", content: "Introduction" },
      {
        type: "p",
        content:
          "Abstractive Health is a generative AI startup in New York City that helps leading healthcare organizations such as Weill Cornell, who face significant challenges when it comes to summarizing large volumes of medical documents. Currently, the process of summarizing medical charts is time-consuming, requiring the expertise of third or fourth-year medical students to manually write summaries for each patient chart. With hundreds of thousands to millions of medical charts to process, this approach was labor-intensive and expensive. To address this issue, Abstractive Health helps leading healthcare institutions like Weill Cornell leverage language models (LLMs) to expedite the summarization process, leading them to collaborate with Anote, a trusted partner known for their innovative annotation interface.",
      },
      { type: "h1", content: "The Problem" },
      {
        type: "p",
        content:
          "Abstractive Health aimed to enhance the summarization process of medical charts by reducing the time and cost involved. For abstractive health, providing training data to the LLMs to predict medical chart summaries requires skilled annotators to label medical summaries. These skilled professionals spend approximately 15 minutes per medical chart, so they can summarize around 4 medical charts per hour. These skilled professionals were highly trained, third to fourth year medical students who earn around $20 per hour. Consequently, Abstractive Health was spending an estimated $50,000 on annotators to summarize 10,000 charts annually, posing a significant drain on resources and time. They sought an interface that would facilitate the development and utilization of LLMs to accelerate the summarization process while providing an efficient platform for the annotators to work with.",
      },
      { type: "h1", content: "Prior Solution" },
      {
        type: "p",
        content:
          "Abstractive Health was previously using an annotation interface called Redcap, which was not ideal for their needs. Annotators were overwhelmed with the complexity of the Redcap interface, often spending unnecessary time grappling with the system rather than focusing on the task of summarization. However, because patient medical charts contain sensitive PII / private information, the data was required to be completely on premise, in an isolated environment, which made finding a better annotation interface extremely difficult. Abstractive Health looked at over 45 annotation interfaces for summaries, but couldn’t find one that met their needs, until Anote.",
      },
      { type: "h1", content: "The Solution: Anote Interface by Anote" },
      {
        type: "p",
        content:
          "Abstractive Health collaborated with Anote, a renowned provider of annotation solutions, to overcome their challenges. Anote offered a comprehensive annotation interface that seamlessly integrated with Abstractive Health’s existing systems. Users could upload medical charts and customize questions for the AI model to generate summaries. With the Anote Interface, they were able to run the annotation system on-premise, keeping the medical charts local and secure within Weill Cornell hospital.",
      },
      { type: "h1", content: "Key Features and Benefits" },
      {
        type: "p",
        content:
          "Streamlined Workflow: With the Anote Interface, Abstractive Health’s annotators experienced a streamlined workflow, eliminating the need for manual chart summarization. They could focus on reviewing and refining the AI-generated summaries from Abstractive Health, rather than starting from scratch.",
      },
      {
        type: "p",
        content:
          "AI Assistance: By leveraging AI capabilities, Abstractive Health harnessed the power of LLMs to automate the summarization process. The AI model generated initial summaries, saving significant time and effort for the annotators.",
      },
      {
        type: "p",
        content:
          "Collaboration and Task Management: The Anote Interface empowered admins to assign medical charts to annotators efficiently. Admins could monitor progress, allocate tasks, and ensure a smooth workflow. Annotators, in turn, had a user-friendly interface to review and refine the AI-generated summaries, enabling collaboration between annotators and the AI model.",
      },
      { type: "h1", content: "Roles of Users in the Anote Interface" },
      {
        type: "p",
        content:
          "Admins: Admins played a crucial role in managing the medical chart summarization process and ensuring its smooth operation. They assigned specific medical charts to annotators, monitored progress of annotators. They also reviewed a sample of the charts summarized by annotators to ensure quality control.",
      },
      {
        type: "p",
        content:
          "Annotators: Annotators were skilled professionals responsible for annotating assigned medical charts and creating accurate and concise summaries. Annotators utilized their expertise to refine and enhance the AI-generated summaries.",
      },
      { type: "h1", content: "Video Demo" },
      {
        type: "p",
        content:
          "Here is a video demo to see the Anote annotation interface in action:",
      },
      {
        type: "p",
        content: "https://www.loom.com/share/e8b829e7612446ed8ab9ff50bd9f2fa3",
      },
      { type: "h1", content: "Results and Impact" },
      {
        type: "p",
        content:
          "By adopting Anote, Abstractive Health achieved substantial improvements in the efficiency and cost-effectiveness of medical document summarization. The adoption of Anote Interface led to an 80% reduction in time spent, translating to an estimated annual savings of $40,000.",
      },
      { type: "h1", content: "Conclusion" },
      {
        type: "p",
        content:
          "Through their collaboration with Anote and the implementation of the Anote Interface, Abstractive Health successfully addressed the challenges associated with summarizing large volumes of medical documents. The adoption of LLMs, facilitated by the interface, revolutionized the workflow, significantly reducing the time and cost involved in the medical summarization process. Abstractive Health, and thereby Weill Cornell, experienced substantial benefits, including increased efficiency, improved accuracy, significant cost savings, and optimized collaboration between admins and annotators. As Abstractive Health continues to leverage the Anote Interface, they look forward to further advancements in AI technology that can help streamline their workflows even more.",
      },
    ],
  },
  {
    logoimage: "/casestudy_logos/10k.png",
    id: "10k",
    category: "Chatting With Documents",
    problem:
      "Extracting critical information from 10-K financial reports is labor-intensive and time-consuming, often requiring analysts to comb through hundreds of pages for data on interest rate exposure, risk factors, and company profiles. Manual review limits efficiency, scalability, and introduces potential for error.",
    solution:
      "We developed an AI-powered platform that allows users to upload 10-K documents and extract key information using machine learning. The system supports prompt customization, human feedback for improved model accuracy, and fine-tuning using large language models like OpenAI and Llama.",
    result:
      "The platform achieved an 88% extraction accuracy rate, reduced analysis time by a factor of 10, and saved approximately 10,000 person-hours and $500,000 annually. It also enabled scalable processing of large volumes of financial documents without sacrificing speed or accuracy.",
    docUrl: caseStudyPDFs["/customers/10k"],
    title: "Extracting Information from 10-Ks",
    industry: "Financial Services",
    image: "/casestudy_photo/10K.png",
    description: "Question Answering",
    metadata: [
    {
      type: "h3",
      content: "Why it matters"
    },
    {
      type: "p",
      content:
        "Reg-heavy documents like 10-Ks bury mission-critical facts under 200+ pages of legal prose. Anote’s workflow frees analysts from CTRL-F purgatory so they can focus on valuation, not excavation."
    },
    {
      type: "h3",
      content: "Inside the workflow"
    },
    {
      type: "p",
      content:
        "✓ Converts incoming PDFs to token-clean text and embeds them in a vector store.\n✓ Uses retrieval-augmented generation to answer arbitrary prompts (e.g., “List interest-rate sensitivities over 50 bps”).\n✓ Incorporates analyst feedback for reinforcement learning from human preferences (RLHF).\n✓ Exports structured tables or narrative memos directly to Excel, Google Sheets, or Tableau."
    },
    {
      type: "h3",
      content: "Impact in numbers"
    },
    {
      type: "p",
      content:
        "• 10× faster turnaround (hours → minutes)."
    },
        {
      type: "p",
      content:
        "• 88 % baseline precision, rising to 93 % after two weeks of feedback."
    },
            {
      type: "p",
      content:
        "• $500 k annual labor savings for a 40-document-per-week research desk."
    },
    {
      type: "h3",
      content: "Get started"
    },
    {
      type: "p",
      content:
        "Drag-and-drop any recent 10-K, ask your first question, and receive a cited answer plus CSV export in under three minutes."
    }
  ]
  },
  {
    logoimage: "/casestudy_logos/Nwsltr.png",
    id: "Newsletter",
    backgroundColor: "bg-teal-800",
    title: "Autonomous AI Newsletter",
    image: "/casestudy_photo/Nwsltr.png",
    insights: [
      { number: "30 articles", text: "URLs processed" },
      { number: "90%", text: "time reduction in newsletter compilation" },
      {
        number: "100%",
        text: "user customization for newsletter aesthetics and writing styles",
      },
    ],
    industry: "Marketing",
    problem:
      "Manual compilation and summarization of news articles for newsletter distribution is time-consuming and lacks personalization, hindering the timely sharing of relevant information with subscribers.",
    solution:
      "We developed a fully autonomous system utilizing Google News API for article retrieval, GPT-3 for content summarization and title generation, and integrated email functionality for direct distribution to a list of subscribers, ensuring relevant and timely content delivery.",
    result:
      "The system streamlined the newsletter creation and distribution process, significantly reducing the time and effort required, while ensuring personalized and relevant content delivery to subscribers.",
    docUrl: caseStudyPDFs["/customers/autonomous-newsletter"],
    description: "Fine Tuning LLMs",
    category: "Chatting With Documents",
    metadata: [
      {
        type: "p",
        content:
          "This document explains the development and deployment of an autonomous AI newsletter system. This system utilizes AI technologies to search for relevant articles from Google News, extract the content using web scraping techniques, summarize the articles using GPT-3 and provides email functionality to distribute the summarized articles to a list of subscribers.",
      },
      {
        type: "h1",
        content: "System Components and Functions",
      },
      {
        type: "h2",
        content: "Article Search and Retrieval",
      },
      {
        type: "p",
        content:
          "The system begins by searching for articles. Utilizing the Google News API, the system seeks articles relevant to given keywords.",
      },
      {
        type: "h2",
        content: "Article Scraping and Summarization",
      },
      {
        type: "p",
        content:
          "Next, the system scrapes the complete content from each article and employs GPT-3 to generate succinct summaries:",
      },
      {
        type: "h2",
        content: "Title Generation",
      },
      {
        type: "p",
        content: "To ensure each summarized article is captivating",
      },
      {
        type: "h2",
        content: "Email List-serv Integration",
      },
      {
        type: "p",
        content:
          "Email functionality is integrated into the system to send the curated and summarized articles to a email listserv of subscribers. This feature requires a CSV file of email recipients.",
      },
      {
        type: "h2",
        content: "System Operation",
      },
      {
        type: "p",
        content: "The autonomous AI newsletter works in three main steps:",
      },
      {
        type: "p",
        content: "1. Enter the Keyword:",
      },
      {
        type: "p",
        content:
          "The user enters a keyword or topic of interest into the newsletter interface. The system then begins a search on Google News using the provided keyword.",
      },
      {
        type: "p",
        content: "2. Obtain Articles:",
      },
      {
        type: "p",
        content:
          "The system retrieves the top 10 articles related to the entered keyword. It then extracts the full content of each article using web scraping techniques.",
      },
      {
        type: "p",
        content: "3. Send to Listserv:",
      },
      {
        type: "p",
        content:
          "The user can upload a CSV to send the newsletter with the articles, generated summaries and titles, to an email list-serv with a click of a button. Depending on the keyword you search, the article should look something like this.",
      },
      {
        type: "p",
        content:
          "By following these steps, users can efficiently discover, summarize, and share relevant news articles, providing their subscribers with valuable insights through the autonomous AI newsletter.",
      },
      {
        type: "h1",
        content: "Customization",
      },
      {
        type: "p",
        content:
          "The autonomous AI newsletter system has advanced features which include customization of newsletter aesthetics, application of stylistic writing patterns, and premium features such as automation and source diversity.",
      },
      {
        type: "h2",
        content: "Newsletter Customization",
      },
      {
        type: "p",
        content:
          "Users have the ability to customize the appearance of the newsletter according to their preference. This includes modifying colors (`Background Color, Card Color, Text in Card Color, Title Color and Subtitle Color`), changing fonts (`Title Font, Subtitle Font, Text in Card Font, Title in Text Card Font`), and editing components (`Change Title, Change Subtitle, Edit Card Content`). This provides flexibility in creating a unique user experience for each newsletter.",
      },
      {
        type: "h2",
        content: "Stylistic Adaptation",
      },
      {
        type: "p",
        content:
          "The system offers the capability to mimic various writing styles. Users can choose from a predefined list of styles that include but are not limited to personalities such as `Albert Einstein`, `Elon Musk`, and `Edgar Allen Poe`. This is implemented via a dictionary where each key is the name of the style and the value is a string describing the style, which serves as a prompt for the AI.",
      },
      {
        type: "p",
        content:
          "Users also have the ability to create their own writing style by providing a custom prompt that is passed in and concatenated to the initial prompt used to summarize articles.",
      },
      {
        type: "h2",
        content: "Premium Features",
      },
      {
        type: "p",
        content:
          "The system offers premium features to enhance functionality and user experience:",
      },
      {
        type: "p",
        content: "1. Automated Sending:",
      },
      {
        type: "p",
        content:
          "For premium users, the system provides the capability to automate the sending of the newsletters. Instead of manually uploading the CSV file of recipient emails each time, the system will automatically send newsletters to the mailing list every n days.",
      },
      {
        type: "p",
        content: "2. Custom Sender:",
      },
      {
        type: "p",
        content:
          "Premium users can send newsletters from their specific email address, providing a personalized touch to their communications.",
      },
      {
        type: "p",
        content: "3. Extended Data Sources:",
      },
      {
        type: "p",
        content:
          "The system can retrieve and summarize news from additional data sources apart from Google News, providing a more comprehensive view on the chosen topic.",
      },
      {
        type: "h1",
        content: "Conclusion",
      },
      {
        type: "p",
        content:
          "The Autonomous AI Newsletter, armed with cutting-edge AI technologies, promises an efficient and enhanced method of distributing curated news content. It brings together the power of Google News search, advanced web scraping, GPT-based text summarization, and seamless email functionality. With further advancements in the form of customization features and premium functionalities, this system illustrates the transformative potential of AI in redefining how we discover, distill, and disseminate information in a personalized, user-centric manner.",
      },
    ],
  },
  {
    logoimage: "/casestudy_logos/NIST.png",
    id: "NIST",
    image: "/casestudy_photo/NIST.png",
    metadata: [
      {
        type: "p",
        content:
          "At Anote, our goal is to create AI systems that are not only powerful but also secure, ethical, and trustworthy. These core values were rigorously tested in a red team evaluation led by the National Institute of Standards and Technology (NIST) ARIA program in partnership with Humane Intelligence. The evaluation provided a platform to demonstrate Anote’s capabilities and resilience in addressing the complex challenges of modern AI governance.",
      },

      { type: "h2", content: "Event Overview" },
      {
        type: "p",
        content:
          "The red team evaluation, hosted in Arlington, Virginia during the CAMLIS conference, represented an opportunity to assess the security, robustness, and ethical compliance of cutting-edge AI systems. Over 30 expert testers, selected from a competitive pool of 500 applicants, conducted systematic attacks on participating AI platforms. Their goal was to identify model vulnerabilities, assess compliance risks, and test the resilience of AI-generated outputs under adverse conditions.",
      },
      {
        type: "p",
        content:
          "More than 50 certified red teamers from Camlis subjected Anote’s system to advanced challenges, including prompt injection attacks, adversarial input manipulations, and data poisoning techniques. Despite these tests, Anote’s platform remained resilient, mitigating threats and reinforcing its commitment to trust and security.",
      },

      { type: "h2", content: "Collaboration with Industry Leaders" },
      {
        type: "p",
        content:
          "The evaluation was a collaborative effort involving leading organizations in the AI ecosystem. Alongside Anote, systems from Meta, Robust Intelligence, and Synthesia underwent rigorous testing, offering a comparative lens on the state of AI resilience.",
      },
      {
        type: "p",
        content:
          "Anote partnered with institutions, including NIST, the Cybersecurity and Infrastructure Security Agency (CISA), and Humane Intelligence, to advance best practices in AI governance.",
      },

      { type: "h2", content: "Anote’s Human-Centered AI Approach" },
      {
        type: "p",
        content:
          "Core to Anote’s success is its human-centered AI methodology, a unique framework that combines advanced AI capabilities with human expertise to tackle domain-specific challenges. This approach is built on three foundational pillars:",
      },
      {
        type: "ol",
        content: [
          "Integrating Generative AI with Human Expertise: Anote leverages the computational power of generative AI while integrating the nuanced insights of human users. This hybrid methodology ensures solutions are both scalable and contextually accurate.",
          "Active Learning from Users: Through iterative learning cycles, Anote refines its models based on user feedback, especially in edge cases. This continuous improvement mechanism drives enhanced performance in domain-specific applications.",
          "Domain-Customized Solutions: Anote tailors its outputs to align with the unique requirements, delivering results that are precise, relevant, and effective.",
        ],
      },

      { type: "h2", content: "Technical Approach" },
      {
        type: "p",
        content:
          "Anote’s technical strategy during the evaluation consisted of three steps:",
      },
      {
        type: "ol",
        content: [
          "Data Annotation: Subject-matter experts labeled datasets to ensure high-quality training inputs. These structured annotations were used for supervised fine-tuning.",
          "Model Training: Anote performed supervised fine-tuning on over 2,400 curated question-answer pairs, which was complemented by Reinforcement Learning from Human Feedback (RLHF) for post-training. This combination improved the models’ reliability and domain-specific accuracy.",
          "Chatbot Integration: The fine-tuned model was integrated into Anote’s chatbot, enabling users to interact with a more reliable, domain-specific, and accurate LLM.",
        ],
      },
      { type: "h2", content: "Evaluation Methodology" },
      {
        type: "p",
        content:
          "The evaluation was based on the 600-1 ARIA Risk Management framework from NIST. It aimed to test Anote’s ability to detect and mitigate malicious activities while ensuring adherence to ethical standards. Throughout the process, Anote’s AI systems successfully identified and blocked all unauthorized attempts, providing real-time feedback to users and maintaining transparency.",
      },
      {
        type: "p",
        content:
          "Ethical compliance was another critical benchmark. Anote achieved a 95% success rate in pre-emptively flagging harmful or misleading outputs. For the remaining edge cases, a human-in-the-loop process ensured no violations occurred, underscoring the platform’s commitment to safety.",
      },
      {
        type: "p",
        content:
          "The integration of Retrieval-Augmented Generation (RAG) with domain-specific fine-tuning of LLMs enabled accurate model outputs while ensuring data privacy. End users are able to compare the results of fine-tuned LLMs with zero-shot LLMs, and route the best LLM into their own chatbot.",
      },

      { type: "h2", content: "Results" },
      {
        type: "ul",
        content: [
          "Resilience Against Malicious Input: Even when faced with heavily redacted documents and adversarial prompts, Anote’s proprietary tagging and entity extraction algorithms maintained high accuracy.",
          "Dynamic Risk Mitigation: Attempts to bypass privacy-preserving summarization features were countered in real time, demonstrating robust risk management capabilities.",
          "Ethical Adherence: When tested with fabricated patient records designed to elicit biased outputs, Anote’s system adhered strictly to compliance standards, ensuring ethical and accurate results.",
        ],
      },
      {
        type: "p",
        content:
          "Over 3,000 interactions during the evaluation highlighted the platform’s reliability, with moderation systems combining AI-driven automation and human oversight to ensure trustworthy outputs.",
      },

      { type: "h2", content: "Anote’s Commitment to Responsible AI" },
      {
        type: "p",
        content:
          "This evaluation reaffirms Anote’s position as a leader in ethical AI innovation. By adhering to NIST’s risk management framework and collaborating with organizations like Humane Intelligence, Anote is setting new standards for secure and responsible AI applications.",
      },
      {
        type: "p",
        content:
          "Anote’s participation in the red team evaluation underscores our commitment to building secure, ethical, and high-performing AI systems. Our platform empowers users across industries to leverage the power of large language models responsibly.",
      },
    ],
    title:
      "Anote's Platform Excels in Rigorous Humane Intelligence and NIST Red Team Evaluation",
    industry: "Government",
    category: "Chatting With Documents",
    description: "AI Evaluation",
    problem:
      "The U.S. National Institute of Standards and Technology (NIST) needed to evaluate large language models (LLMs) for potential use in government applications. They required a robust method for scoring LLM responses across tasks like summarization, classification, and Q&A, but faced challenges with cost, latency, and bias when relying solely on human evaluators.",
    solution:
      "Anote implemented a hybrid evaluation system using GPT-4 to assess LLM outputs across various metrics like coherence, accuracy, and relevance. To reduce bias, Anote engineered prompt templates and score normalization strategies, and also incorporated feedback from NIST reviewers to fine-tune the evaluation criteria.",
    result:
      "The approach enabled scalable and consistent scoring across thousands of model completions, reducing the time and cost associated with human-only evaluations. NIST was able to benchmark models more efficiently, helping guide decisions around safe and effective use of AI technologies in federal agencies.",
    docUrl: caseStudyPDFs["/customers/nist"],
  },
  {
    logoimage: "/casestudy_logos/Confidential.png",
    id: "SocialMedia",
    image: "/casestudy_photo/confidential.png",
    category: "Classifying Text",
    title: "Text Categorization for Social Media Data",
    industry: "Social Media Analytics",
    problem:
      "Categorizing text data from various social media platforms to identify patterns and trends within different categories and understand the corresponding engagement metrics is challenging.",
    solution:
      "We employed zero-shot classification techniques using Spacy and Hugging Face frameworks and augmented the dataset with synthetic data to improve the model's ability to generalize and make accurate predictions.",
    result:
      "After implementing the solution, we evaluated the models on manually labeled test data to measure performance metrics such as accuracy, precision, recall, and support. Additionally, exploratory data analysis was conducted to gain insights into categorized social media data.",
    insights: [
      { number: "100 rows", text: "rows of data manually labeled" },
      { number: "23", text: "Total categories to predict" },
      { number: "96%", text: "Model Accuracy on the test dataset" },
    ],
    metadata: [
      {
        type: "h2",
        content: "Problem",
      },
      {
        type: "p",
        content:
          "A large social media company aiming to help consumers analyze content on social media platforms like Instagram and TikTok, was looking to predict the categories of text data extracted from captions in Instagram, TikTok, and YouTube posts. By accurately categorizing the text data, the company aims to identify patterns and trends within different categories and understand the corresponding engagement metrics, including the number of likes, comments, shares, and the frequency of posts in each category on different social media platforms. This information can provide valuable insights for content analysis, marketing strategies, and identifying emerging trends on social media platforms.",
      },
      {
        type: "h2",
        content: "Dataset",
      },
      {
        type: "p",
        content:
          "To tackle this problem, we loaded the social media text data from various channels and performed text cleaning operations. To preprocess that data, converted the text to lowercase, removed punctuation, replaced newlines and hashtags, and eliminated extra whitespaces. We were trying to predict the following categories:",
      },
      {
        type: "ul",
        content: [
          "Business",
          "Animals/Pets",
          "Causes & Charities",
          "Science & Technology",
          "Sports",
          "TV & Movies",
          "Lifestyle",
          "Music",
          "Home Improvement",
          "Health & Fitness",
          "Fashion",
          "Religion",
          "Travel",
          "Cosplay",
          "Mental Health",
          "Gaming",
          "Comedy",
          "Dance",
          "Food/Cooking",
        ],
      },
      {
        type: "h2",
        content: "Approach",
      },
      {
        type: "p",
        content:
          "To address this problem, we will employ various techniques and approaches:",
      },
      {
        type: "h3",
        content: "Zero Shot Classification",
      },
      {
        type: "p",
        content:
          "We will explore the application of zero-shot classification techniques using Spacy and Hugging Face frameworks. Zero-shot classification allows the model to predict categories that were not seen during the training phase.",
      },
      {
        type: "h2",
        content: "Spacy:",
      },
      {
        type: "p",
        content:
          "We leveraged the Spacy library to develop a zero-shot text classification model. We used a particular model called \u201cen_core_web_md. \u201d This model comes with pre-trained word meanings and language details. We added a component called \u201ctext_categorizer\u201d to Spacy and made it work specifically for the categories we wanted to classify.",
      },
      {
        type: "h3",
        content: "Hugging Face:",
      },
      {
        type: "p",
        content:
          "Additionally, we explored the Hugging Face library, which provides a wide range of pre-trained models for NLP tasks. The model that we used was called \u201ctypeform/distilbert-base-uncased-mnli\u201d",
      },
      {
        type: "h3",
        content: "Synthetic Data Approach",
      },
      {
        type: "p",
        content:
          "To augment the labeled data for training the text categorization models, we utilized a synthetic data approach. Synthetic data generation creates additional examples for each category, providing a more diverse and balanced training dataset. Here are a few examples for each category:",
      },
      {
        type: "h3",
        content: "1. Business:",
      },
      {
        type: "ul",
        content: [
          "This text is about business",
          "Here\u2019s some information related to the business industry",
          "\u201cBusiness strategies and trends are evolving",
        ],
      },
      {
        type: "h3",
        content: "2. Animals/Pets:",
      },
      {
        type: "ul",
        content: [
          "Learn how to care for your pets and provide them with a loving\nenvironment",
          "Discover interesting facts about different animal species",
          "Pets bring joy and companionship to our lives",
        ],
      },
      {
        type: "h3",
        content: "3. Causes & Charities:",
      },
      {
        type: "ul",
        content: [
          "Support important causes that align with your values",
          "Charities work tirelessly to address various social issues",
          "Join forces with charities to create a better world",
        ],
      },
      {
        type: "h3",
        content: "4. Science & Technology:",
      },
      {
        type: "ul",
        content: [
          "Discover how technology is tranus industries",
          "Explore the fascinating world of robotics and artificial intelligence",
          "Science and technology drive innovation and progress",
        ],
      },
      {
        type: "h3",
        content: "5. Sports:",
      },
      {
        type: "ul",
        content: [
          "cThis text is about sports",
          "Get the latest updates on your favorite sports teams and events",
          "Athletes inspire us with their dedication and achievements",
        ],
      },
      {
        type: "p",
        content:
          "These synthetic examples were generated to expand the training dataset and ensure a more comprehensive representation of each category. By incorporating synthetic data along with the labeled data, we can improve the models\u2019 ability to generalize and make accurate predictions for text categorization tasks.",
      },
      {
        type: "h2",
        content: "Results",
      },
      {
        type: "p",
        content:
          "After implementing our text categorization solution using zero-shot classification techniques and synthetic data augmentation, we evaluated the performance of the models and conducted exploratory data analysis to gain insights into the categorized social media data.",
      },
      {
        type: "h3",
        content: "Model Evaluation",
      },
      {
        type: "p",
        content:
          "We manually labeled 100 rows of data as \u201ctest data\u201d to evaluate the models\u2019 metrics such as accuracy, precision, recall, and support. The rest of the data was used as \u201ctrain data\u201d for training the models. We used this labeled test data to measure the performance of our models to compare accuracy.",
      },
      {
        type: "h3",
        content: "Exploratory Data Analysis",
      },
      {
        type: "p",
        content:
          "To gain a better understanding of the categorized social media data, we conducted exploratory data analysis. The analysis focused on two aspects: the distribution of predicted categories by data source and the relationship between predicted categories and engagement metrics such as likes.",
      },
      {
        type: "p",
        content:
          "By examining the distribution of predicted categories by data source, we gained insights into the sources of the data and their prevalence across social media platforms like TikTok, Instagram, and YouTube. This information allowed us to identify any variations in the content and engagement patterns across different platforms.",
      },
      {
        type: "p",
        content:
          "The likes-by-category analysis revealed interesting trends and patterns. By visualizing the relationship between predicted categories and the number of likes, we were able to identify categories that garnered higher engagement and those that were less popular. Understanding the engagement metrics associated with each category can help in developing effective content analysis, marketing strategies, and trend identification on social media platforms.",
      },
      {
        type: "h2",
        content: "Next Steps",
      },
      {
        type: "p",
        content:
          "Based on the results and analysis of our text categorization project, we have identified several next steps to further enhance the models\u2019 performance and provide valuable insights:",
      },
      {
        type: "h3",
        content: "Few-Shot Learning",
      },
      {
        type: "p",
        content:
          "Incorporating few-shot learning techniques can enhance the categorization models\u2019 accuracy, especially for categories with limited labeled samples. By utilizing a few-shot learning approach, we can leverage a small number of labeled instances to improve category predictions. This will further refine the models\u2019 ability to generalize and make accurate predictions for text categorization tasks.",
      },
      {
        type: "h3",
        content: "Human Feedback vs. Zero-Shot Models",
      },
      {
        type: "p",
        content:
          "To validate the superiority of human feedback over zero-shot classification models, we plan to conduct a comparative analysis. We will manually label additional rows of data on the \u201ctrain data\u201d and run the few-shot model with different amounts of labeled data.\nThis analysis will demonstrate how the accuracy of the few-shot model improves with increasing human feedback, surpassing the accuracy achieved by the zero-shot models. This evidence will highlight the importance of incorporating human expertise in text categorization tasks when high accuracy is desired.",
      },
    ],
    docUrl: caseStudyPDFs["/customers/social-media"],
    description: "Text Classification",
  },
  {
    logoimage: "/casestudy_logos/Confidential.png",
    id: "CategoricalClass",
    image: "/casestudy_photo/categoricalClass.png",
    category: "Classifying Text",
    title:
      "Enhancing Categorical Classification of Text Data using Generative AI and Human Feedback",
    industry: "Competitor Intelligence",
    problem:
      "A competitor intelligence company with 1100 rows of textual company information needed to efficiently categorize and tag each company, including subcategories, using predefined categories and tags. The challenge was to evaluate the effectiveness of human input and labeling compared to traditional zero-shot approaches for this categorization.",
    solution:
      "The problem was solved by comparing zero-shot and few-shot learning models using Claude, an AI chatbot API. A dataset of 1100 rows was split into a 100-row test set and a 50-row 'training set' for few-shot models. The zero-shot model used Claude with descriptions of categories and subcategories to predict classifications without examples. The few-shot model used the same category information but included labeled examples (first 25, then 50 total) to train Claude. Accuracy was measured on the 100-row evaluation dataset for both approaches.",
    result:
      "The zero-shot model achieved 75% Tier 2 Category Prediction Accuracy. The few-shot model with 25 labeled examples improved to 81% Tier 2 Category Prediction Accuracy. The few-shot model with 50 labeled examples further improved to 87% Tier 2 Category Prediction Accuracy. These results supported the hypothesis that incorporating human input and labeled training data leads to better classification accuracy than traditional zero-shot approaches, particularly for Tier 2 categories.",
    docUrl: caseStudyPDFs["/customers/competitor-intelligence"],
    description: "Multilabel Classification",
    metadata: [
      { type: "h2", content: "Introduction" },
      {
        type: "p",
        content:
          "This case study delves into a prominent player in the competitor intelligence field, currently facing a challenge with categorizing companies in their dataset. With a collection of 1100 rows of textual information about diverse companies, the competitor intelligence company aims to efficiently categorize and tag each company, including subcategories, using predefined categories and tags. The study focuses on evaluating the effectiveness of human input and labeling in the categorization process, specifically comparing it to the limitations of traditional zero-shot approaches.",
      },

      { type: "h2", content: "Dataset Overview" },
      {
        type: "p",
        content:
          "The text dataset incorporated 1100 records of information such as the URL of the company’s site, the company site’s meta title, the site’s meta description, and manually labeled categories (Tier 1 and Tier 2 categories) that each company’s product or service corresponded to. These categories are explained in more detail in the next section. The goal of this study was to use few-shot learning techniques to accurately predict the Tier 2 categories of the set. The first 100 rows of the dataset were used as a test set to evaluate the zero- and few-shot models, and the next 50 rows of the data were used as a ‘training set’ to feed to the few-shot models.",
      },

      { type: "h2", content: "Parent Categories and Tags" },
      {
        type: "ul",
        content: [
          "Parent Categories (Tier 1): A list of predefined categories used for classification.",
          "Tags (Tier 2): A set of labels assigned to companies, including subcategories.",
        ],
      },
      {
        type: "p",
        content:
          "The parent categories and subcategories that were used to manually label the dataset were defined in a taxonomy file, with each row of the file consisting of a parent-category column and its corresponding subcategories.",
      },

      { type: "h2", content: "Hypothesis" },
      {
        type: "p",
        content:
          "The hypothesis suggests that by incorporating human input and manually labeling a subset of the dataset, better results can be achieved compared to traditional zero-shot approaches. In other words, if we provide a certain number of examples of input data with correctly labeled parent categories and subcategories (Tier 1 and Tier 2 labels) to a few-shot model, the model will be able to more accurately predict the Tier 1 and Tier 2 labels of unseen data.",
      },
      { type: "p", content: "Current Results from GPT-3 Shot Predictions:" },
      {
        type: "ul",
        content: [
          "Tier 1 Category Prediction Accuracy: 85%",
          "Tier 2 Category Prediction Accuracy: 75%",
        ],
      },

      { type: "h2", content: "Experimental Design" },
      {
        type: "p",
        content:
          "To test the hypothesis, the dataset of 1100 rows was split into training and test data. The test dataset consisted of 100 rows, which were manually labeled with categories and subcategories. The remaining data formed the training set. The following models were evaluated:",
      },
      {
        type: "ol",
        content: [
          "Zero-shot model using CLAUDE: In this model, we used the Claude chatbot API from Anthropic along with prompt-engineering techniques to predict the parent category and subcategory of a record containing site meta title and description. The prompt to Claude included a description of the list of categories along with their subcategories, then requested a category and subcategory for each test record.",
          "Few-shot model using CLAUDE: As with the zero-shot model, information about the different parent categories and subcategories was provided in the prompt to Claude. Additionally, the prompt included examples of records with correctly labeled Tier 1 and Tier 2 categories before requesting predictions for the given meta descriptions and titles.",
        ],
      },

      { type: "h2", content: "Training and Evaluation" },
      {
        type: "ol",
        content: [
          "Zero-shot models were initially trained on the training set, which contained no labels.",
          "The evaluation dataset, comprising 100 rows, was used to measure the accuracy of the zero-shot models.",
          "Next, 25 rows from the training set (rows 101–125 of the original 1100-row dataset) were labeled and added as training data. The models’ accuracy was re-evaluated using the evaluation dataset.",
          "Subsequently, an additional 25 rows (50 rows total) were labeled and included as training data to assess the models’ accuracy once more.",
        ],
      },

      { type: "h2", content: "Results and Analysis" },
      {
        type: "p",
        content:
          "The effects of incorporating human input and adding labeled training data on model accuracy were analyzed using the evaluation dataset. The accuracy of the zero-shot models was compared before and after adding labeled data to determine the impact. We noticed that the Tier 2 categories were most affected by human input:",
      },
      {
        type: "ul",
        content: [
          "Accuracy of Tier 2 Category Prediction",
          "Zero-shot model using CLAUDE: 75%",
          "Few-shot model using CLAUDE with 25 labeled examples: 81%",
          "Few-shot model using CLAUDE with 50 labeled examples: 87%",
        ],
      },
      {
        type: "p",
        content:
          "These results show an improvement in Tier 2 prediction accuracy from 75% to 87%, outperforming the 75% accuracy achieved with GPT-3 zero-shot predictions and supporting the hypothesis that human-labeled examples enhance model performance.",
      },

      { type: "h2", content: "Next Steps" },
      {
        type: "p",
        content:
          "For future work, we recommend incorporating human feedback into a SetFit model. SetFit excels at classification tasks and can produce multi-label outputs, allowing the assignment of multiple tags within a single parent category. It relies on fine-tuning rather than prompt engineering, offering a more robust approach. Additionally, increasing the number of labeled examples per parent category or subcategory will help avoid class-imbalance issues and further improve few-shot performance.",
      },
    ],
  },
  {
    logoimage: "/casestudy_logos/Openads.png",
    id: "OpenAds",
    category: "Classifying Text",
    insights: [
      { number: "89.47%", text: "Accuracy with 2 labels per category" },
      { number: "93.42%", text: "Accuracy with 8 labels per category" },
      { number: "94.74%", text: "Accuracy with 16 labels per category" },
    ],
    problem:
      "Due to the complexity of OpenAds' taxonomy, achieving high accuracy in hierarchical classification is difficult. GPT-4 had a limitation of low accuracy, prompting OpenAds to explore methods for improving the precision and relevance of their generated ads.",
    solution:
      "Evaluating whether integrating human feedback can lead to increased accuracy in the hierarchical classification models over time. By incorporating human input into their AI system iteratively, OpenAds aims to enhance the system's performance and deliver higher-quality ads.",
    result:
      "The results demonstrate that human feedback significantly improved the accuracy of OpenAds' generative AI system over time. By retraining the model with more labels per category, accuracy increased from 89.47% to 94.74%, leading to more robust results.",
    docUrl: caseStudyPDFs["/customers/openads"],
    title: "Enhancing Advertisements using Gen AI & Human Feedback",
    industry: "Advertisement",
    image: "/casestudy_photo/openads.png",
    description: "Hierarchical Classification",
    metadata: [
      {
        type: "h1",
        content: "Background",
      },
      {
        type: "p",
        content:
          "OpenAds, a leading company in generative AI research for advertisements, aims to revolutionize the way ads are generated. They possess a vast dataset comprising 80,000 rows of prompt data that needs to be accurately categorized into 640 hierarchical categories, including subcategories, sub-subcategories, and sub-sub-subcategories. The accuracy of these predictions is of utmost importance as it directly impacts the quality of ads delivered to OpenAds\u2019 end users.",
      },
      {
        type: "p",
        content:
          "OpenAds currently utilizes GPT-4, a powerful generative AI model, for generating advertisement predictions. However, GPT-4 has a limitation of low accuracy, prompting OpenAds to explore methods for improving the precision and relevance of their generated ads. They believe that incorporating human feedback into their AI system could be the key to achieving higher accuracy over time.",
      },
      {
        type: "h1",
        content: "Objectives",
      },
      {
        type: "p",
        content:
          "The primary objective of this case study is to investigate the impact of human feedback on enhancing the performance of OpenAds\u2019 generative AI system. The specific goals are as follows:",
      },
      {
        type: "ul",
        content: [
          "Determine whether integrating human feedback can lead to increased accuracy in the hierarchical classification of advertisement prompts.",
          "Assess the effectiveness of adding more training data for each category in improving the overall accuracy of the system.",
          "Evaluate the feasibility of leveraging human feedback to iteratively refine the generative AI model and enhance ad generation capabilities.",
        ],
      },
      {
        type: "h1",
        content: "Methodology",
      },
      {
        type: "p",
        content:
          "In order to accomplish the defined objectives, OpenAds devised a robust experimental approach. The task at hand involves working with hierarchical categories that are structured across three levels. Our approach revolves around predicting the hierarchical data based on textual descriptions. By leveraging this approach, we aim to effectively interpret and assign the appropriate categories to the given text descriptions.",
      },
      {
        type: "h1",
        content: "Dataset Creation",
      },
      {
        type: "p",
        content:
          "To facilitate the proof of concept, we selected a subsample of 6 leaf nodes tier 3 category predictions. We created a training dataset consisting of labeled items for each category. Specifically, we labeled 2 items, 8 items, and 16 items for each category, respectively. A separate test dataset was created, comprising labels across 6 different categories within the Tier 3 hierarchy. These labels were meticulously assigned by human annotators to serve as a benchmark for evaluating the system\u2019s accuracy.",
      },
      {
        type: "h2",
        content: "Train Dataset:",
      },
      {
        type: "p",
        content:
          "Category - Number of Samples  \nBuddhism - 22  \nDay Trips - 21  \nMental Health - 27  \nProgramming Languages - 25  \nResume Writing and Advice - 15  \nWedding - 15  \nTotal - 125",
      },
      {
        type: "h2",
        content: "Evaluation Dataset:",
      },
      {
        type: "p",
        content:
          "Category - Number of Samples  \nBuddhism - 12  \nDay Trips - 15  \nMental Health - 20  \nProgramming Languages - 18  \nResume Writing and Advice - 9  \nWedding - 2  \nTotal - 76",
      },
      {
        type: "h1",
        content: "Approach",
      },
      {
        type: "p",
        content:
          "After preparing the mappings between parent and child nodes, as well as identifying the corresponding leaf nodes, we can focus our model predictions solely on the leaf nodes by utilizing the parent node mappings. To achieve this, we utilize the SetFit package to prepare the few-shot model.",
      },
      {
        type: "p",
        content: "The function takes four parameters:",
      },
      {
        type: "ul",
        content: [
          "train_df: A dataset used for training the model.",
          "test_df: A dataset used for evaluating the model.",
          "model: The path of the pretrained model to use. If not specified, it defaults to \u201csentence-transformers/paraphrase-mpnet-base-v2\u201d.",
          "tier: The name of the column in the datasets that represents the tier or level of categories. By default, it is set to \u2018tier3_encoded\u2019.",
        ],
      },
      {
        type: "p",
        content:
          "The function loads a SetFit model from the Hugging Face model hub using the provided model parameter. This model is pretrained on a large corpus of text and can be fine-tuned for few-shot learning. It initializes a SetFitTrainer object, which is responsible for training and evaluating the SetFit model. The trainer is configured with the following parameters:",
      },
      {
        type: "ul",
        content: [
          "model: The SetFit model object created in the previous step.",
          "train_dataset: The training dataset (train_df) provided as a parameter.",
          "eval_dataset: The evaluation dataset (test_df) provided as a parameter.",
          "loss_class: The loss function to use during training. In this case, it uses the CosineSimilarityLoss, which measures the similarity between text embeddings.",
          "metric: The evaluation metric to track during training (“accuracy”).",
          "batch_size: The batch size used during training. It is set to 4.",
          "num_iterations: The number of text pairs to generate for contrastive learning. Contrastive learning is a technique used to learn from limited labeled data. It generates pairs of similar and dissimilar samples for training. Here, it generates 8 pairs.",
          "num_epochs: The number of epochs to use for contrastive learning. Each epoch processes the entire training dataset once. In this case, it is set to 1.",
          "column_mapping: A dictionary that maps the column names in the datasets to the expected column names by the trainer. It specifies that the \u201ctext\u201d column in the datasets should be mapped to \u201ctext\u201d, and the tier column should be mapped to \u201clabel\u201d.",        ],
      },
      {
        type: "p",
        content:
          "Finally, the function returns the configured SetFitTrainer object. This code sets up a SetFit model and trainer for few-shot learning, allowing the model to be trained on a small labeled dataset and evaluated on another dataset.",
      },
      {
        type: "h1",
        content: "Human Feedback Integration:",
      },
      {
        type: "p",
        content:
          "The accuracy assessment of our generative AI system was conducted by evaluating its performance on a test dataset that had been labeled by human annotators. This labeled dataset served as the benchmark against which we measured the accuracy of the AI model and assessed the impact of incorporating human feedback. The level of human feedback was determined by the number of labels per category that were utilized to retrain the fine-tuned SetFit model.",
      },
      {
        type: "p",
        content:
          "One of our main objectives was to demonstrate how our model\u2019s performance evolves with increasing levels of human feedback. In the training dataset, we had a total of 125 samples representing 6 leaf nodes, all of which were labeled by human annotators. To explore the effect of human feedback, we resampled the training dataset into three categories. Each category contained the same 6 sub leaf nodes, but with varying numbers of samples: 2 times, 8 times, and 16 times.",
      },
      {
        type: "p",
        content:
          "For each category of the dataset, we ran the model that had been trained on the corresponding resampled dataset. The results of these evaluations are presented in the following table.",
      },
      {
        type: "h1",
        content: "Results",
      },
      {
        type: "p",
        content:
          "Dataset - Setfit Accuracy  \n2 labels per category - 0.8947  \n8 labels per category - 0.9342  \n16 labels per category - 0.9474",
      },
      {
        type: "p",
        content:
          "The results of this case study demonstrate the significant impact of human feedback in improving the accuracy and relevance of OpenAds\u2019 generative AI system. The following key aspects were analyzed to gain valuable insights:",
      },
      {
        type: "li",
        content:
          "_Effect of Human Feedback on Performance:_ The study examined how the incorporation of human feedback positively influenced the system\u2019s accuracy, particularly in hierarchical classification. The feedback provided by human",
      },
      {
        type: "li",
        content:
          "_Correlation between Training Data and Accuracy:_ The study investigated the relationship between the amount of training data available for each category and the resulting accuracy. By analyzing the impact of adding more labels per category, the study revealed a direct correlation between the quantity of training data and improved accuracy.",
      },
      {
        type: "li",
        content:
          "_Feasibility and Benefits of Iterative Human Feedback:_ The study explored the feasibility and potential benefits of integrating human feedback as an iterative process. By continuously refining the generative AI model based on human input, this study shows that it is feasible to enhance the system\u2019s performance and deliver higher-quality ads.",
      },
      {
        type: "h1",
        content: "Future Approaches",
      },
      {
        type: "p",
        content:
          "In this particular study, our model was trained using only six categories across three levels of labels. However, there are potential future approaches that can further enhance the model\u2019s capabilities. One such approach involves expanding the training process to incorporate a more comprehensive set of categories. By including a broader range of categories, the model can gain a deeper understanding of various topics and improve its ability to classify and predict labels.",
      },
      {
        type: "p",
        content:
          "Furthermore, another avenue for improvement involves expanding the model to encompass up to three levels of labels. While the current implementation focuses on three levels, there may be instances where additional levels of granularity are necessary to accurately capture the complexity and nuances of the data. By extending the model to accommodate three levels of labels, we can refine the categorization process and provide more detailed insights into the relationships between different categories.",
      },
      {
        type: "p",
        content:
          "These future approaches aim to enhance the model\u2019s performance and make it more robust and versatile in handling a wider range of categorization tasks. Via incorporating more categories and expanding the label hierarchy, we can unlock the potential for improved accuracy and a more comprehensive understanding of the data.",
      },
      {
        type: "h1",
        content: "Summary",
      },
      {
        type: "p",
        content:
          "In conclusion, this case study emphasizes the potential of leveraging human feedback to enhance the accuracy and quality of generative AI in advertisement generation. The findings provide actionable insights for OpenAds to refine their generative AI system, address the limitations of low accuracy in GPT-4, and ultimately deliver more precise and relevant ads to their users. By combining the power of generative AI with human expertise, OpenAds aims to usher in a new era of advertisement generation, where human feedback plays a vital role in continuously improving the accuracy and effectiveness of AI-driven ad creation.",
      },
    ],
  },
];
