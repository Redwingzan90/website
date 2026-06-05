with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Property #1 is at index 3450 (0-based = line 3451)
# Property #4 is at index 3453
# Property #5 is at index 3454

# 1. Remove Property #1 (line 3451, index 3450)
del lines[3450]

# Now indices shifted: Property #4 at 3452, Property #5 at 3453

# 2. Update Property #4
lines[3452] = lines[3452].replace("price:'$42,000'", "price:'$45,000'")
lines[3452] = lines[3452].replace("downPayment:'Cash'", "downPayment:'$650'")
lines[3452] = lines[3452].replace("monthly:'Cash Sale'", "monthly:'$650/mo'")
lines[3452] = lines[3452].replace("interestRate:'N/A'", "interestRate:'12%'")
lines[3452] = lines[3452].replace(", loanTerm:'Cash Only'", "")
lines[3452] = lines[3452].replace("'Cash Sale — $42,000 Each'", "'$650 Down / $650 Monthly'")

# 3. Update Property #5
lines[3453] = lines[3453].replace("monthly:'$540/mo'", "monthly:'$650/mo'")
lines[3453] = lines[3453].replace("'$650 Down / $540 Monthly'", "'$650 Down / $650 Monthly'")

with open('index.html', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Done")
