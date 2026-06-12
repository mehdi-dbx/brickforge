# Evaluation

BrickForge includes an MLflow-based evaluation pipeline for measuring agent quality.

## Overview

The eval system uses MLflow GenAI evaluation with a custom LLM judge scorer. You define test datasets, run the eval, and track results in MLflow experiments.

Source: `brickforge/eval/run_eval.py`, `brickforge/eval/scorer.py`

## Components

### LLM judge scorer

`brickforge/eval/scorer.py` defines a custom scorer that uses your configured Foundation Model endpoint to judge agent responses.

The scorer evaluates responses against:

- **Baseline**: does the response match expected output?
- **Guidelines**: does the response follow specified quality criteria?

### Test datasets

Define test cases as input/expected-output pairs. The eval runner sends each input to the agent and compares the response against the expected output using the LLM judge.

### MLflow tracking

Results are logged to the MLflow experiment configured in the **MLflow** setup block (`app.mlflow_experiment_id`).

Tracked metrics include:

- Per-question scores from the LLM judge
- Aggregate pass/fail rates
- Response latency

## Running an evaluation

### From the Setup App

1. Configure the **MLflow** setup block (create or select an experiment)
2. Prepare your test dataset
3. Run the eval from the setup panel

### From the command line

```bash
python -m brickforge.eval.run_eval
```

The script reads config from `config.json`, connects to the agent endpoint, runs all test cases, and logs results to MLflow.

## Iteration workflow

1. Deploy your agent
2. Run eval against test dataset
3. Review scores in MLflow
4. Adjust prompts, tools, or knowledge base
5. Redeploy and re-eval
6. Compare runs in MLflow experiment

!!! tip
    Start with a small test dataset (5-10 questions) covering your agent's core capabilities. Expand as you iterate.
